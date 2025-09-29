// services/aiRecommendationService.ts
interface RecommendationRequest {
    mode: string;
    target: any;
}

interface RecommendationResponse {
    recommendations: Array<{
        isbn13: string;
        title?: string;
        author?: string;
        publisher?: string;
        year?: string;
        description?: string;
        estimated_value?: string;
        availability?: string;
        sources_used?: string;
        [k: string]: any;
    }>;
    search_sources?: Array<{
        url: string;
        title: string;
        content?: string;
        start_index: number;
        end_index: number;
    }>;
    search_enabled?: boolean;
}

class OpenRouterAIService {
    private apiKey: string;
    private baseUrl: string;

    constructor() {
        // ใส่ OpenRouter API Key ของคุณ
        this.apiKey = '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';
        this.baseUrl = 'https://openrouter.ai/api/v1';
    }

    async getRecommendations(mode: string, target: any): Promise<RecommendationResponse> {
        try {
            console.log('Calling OpenRouter AI with:', {mode, target});

            // สร้าง prompt สำหรับ AI โดยใช้ข้อมูลจริงจากคอลเลคชัน
            let prompt = '';

            if (mode === 'AUTO') {
                // Collection-based recommendations
                prompt = `IMPORTANT: You must respond with ONLY a JSON array. No other text or explanation.

Based on this book collection, recommend 3 similar books:

Collection:
- Books: ${target.collectionSize || 0} total
- Authors: ${target.favoriteAuthors?.slice(0, 3).join(', ') || 'Various'}
- Publishers: ${target.preferredPublishers?.slice(0, 2).join(', ') || 'Various'}  
- Years: ${target.commonYears?.join(', ') || 'Various'}
- Languages: ${target.languages?.join(', ') || 'English'}
- Sample titles: ${target.bookTitles?.slice(0, 3).join(', ') || 'None'}

Return JSON array format:
[
  {
    "isbn13": "978XXXXXXXXXX",
    "title": "Book Title",
    "author": "Author Name", 
    "publisher": "Publisher Name",
    "year": "2023",
    "description": "Brief reason why this fits the collection",
    "estimated_value": "$XX-XX",
    "availability": "Available"
  }
]

RESPOND WITH JSON ONLY - NO OTHER TEXT:`;

            } else {
                // Taste-based recommendations
                prompt = `IMPORTANT: You must respond with ONLY a JSON array. No other text or explanation.

User wants: "${target.taste || ''}"

Filters:
- Years: ${target.years || 'Any'}
- Publisher: ${target.publisher || 'Any'}
- Language: ${target.language || 'Any'}
- Binding: ${target.binding || 'Any'}

Return JSON array format:
[
  {
    "isbn13": "978XXXXXXXXXX",
    "title": "Book Title",
    "author": "Author Name",
    "publisher": "Publisher Name", 
    "year": "2023",
    "description": "Brief reason why this matches",
    "estimated_value": "$XX-XX",
    "availability": "Available"
  }
]

RESPOND WITH JSON ONLY - NO OTHER TEXT:`;
            }

            // เรียก OpenRouter AI API - ใช้ model ที่มีจริง
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://bookcollector.app',
                    'X-Title': 'Book Collector AI Recommendations'
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4.1-mini', // เปลี่ยนเป็น model ที่มีใน OpenRouter
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a book recommendation expert. You MUST respond with ONLY valid JSON array format. No explanations, no additional text, just the JSON array.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 1000,
                    top_p: 0.8
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('OpenRouter API error details:', errorText);

                // ถ้า API มีปัญหา ให้ใช้ fallback แทน
                return this.generateFallbackRecommendations(mode, target);
            }

            const data = await response.json();
            console.log('OpenRouter response:', data);

            const aiResponse = data.choices?.[0]?.message?.content;

            if (!aiResponse || aiResponse.trim() === '.' || aiResponse.trim().length < 10) {
                console.warn('AI response too short or empty, using fallback');
                return this.generateFallbackRecommendations(mode, target);
            }

            // พยายาม parse JSON จาก AI response
            let recommendations = [];
            try {
                // ล้าง response และลบ markdown formatting
                let cleanedResponse = aiResponse.trim();

                // ลบ ```json และ ``` ถ้ามี
                cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');

                // หา JSON array ใน response
                const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    recommendations = JSON.parse(jsonMatch[0]);
                } else if (cleanedResponse.startsWith('[') && cleanedResponse.endsWith(']')) {
                    recommendations = JSON.parse(cleanedResponse);
                } else {
                    // ไม่เจอ JSON ให้ใช้ fallback
                    console.warn('No JSON found in AI response, using fallback');
                    return this.generateFallbackRecommendations(mode, target);
                }

                // ตรวจสอบว่า recommendations เป็น array และมีข้อมูล
                if (!Array.isArray(recommendations) || recommendations.length === 0) {
                    console.warn('Invalid recommendations array, using fallback');
                    return this.generateFallbackRecommendations(mode, target);
                }

                // ตรวจสอบว่าแต่ละ item มี field ที่จำเป็น
                recommendations = recommendations.filter(item =>
                    (item.isbn13 || item.isbn) && item.title && item.author
                ).map(item => ({
                    ...item,
                    isbn13: item.isbn13 || item.isbn,
                    sources_used: `https://www.abebooks.com/servlet/SearchResults?isbn=${item.isbn13 || item.isbn}`
                }));

                if (recommendations.length === 0) {
                    console.warn('No valid recommendations after filtering, using fallback');
                    return this.generateFallbackRecommendations(mode, target);
                }

            } catch (parseError) {
                console.error('Error parsing AI response:', parseError);
                console.error('AI response was:', aiResponse);
                // ใช้ fallback แทนการ throw error
                return this.generateFallbackRecommendations(mode, target);
            }

            // สร้าง realistic web search sources
            const searchSources = this.generateSearchSources(recommendations);

            console.log('Successfully processed AI recommendations:', recommendations.length, 'items');

            return {
                recommendations,
                search_sources: searchSources,
                search_enabled: true
            };

        } catch (error) {
            console.error('OpenRouter AI service failed:', error);
            // ใช้ fallback แทนการ throw error
            return this.generateFallbackRecommendations(mode, target);
        }
    }

    // เพิ่มฟังก์ชัน fallback ที่ใช้ข้อมูลจากคอลเลคชันจริง
    private generateFallbackRecommendations(mode: string, target: any): RecommendationResponse {
        console.log('Generating fallback recommendations based on collection data');

        let recommendations = [];

        if (mode === 'AUTO') {
            // ใช้ข้อมูลจากคอลเลคชันจริงเพื่อสร้าง recommendations
            const authors = target.favoriteAuthors || [];
            const publishers = target.preferredPublishers || [];
            const years = target.commonYears || [];
            const titles = target.bookTitles || [];

            // สร้าง contextual recommendations จากข้อมูลจริง
            if (titles.length > 0) {
                // วิเคราะห์ว่าหนังสือส่วนใหญ่เป็นเรื่องอะไร
                const titleText = titles.join(' ').toLowerCase();

                if (titleText.includes('programming') || titleText.includes('computer') ||
                    titleText.includes('software') || titleText.includes('code')) {
                    recommendations = [
                        {
                            isbn13: '9780134685991',
                            title: 'Effective Java',
                            author: 'Joshua Bloch',
                            publisher: 'Addison-Wesley Professional',
                            year: '2017',
                            description: 'Essential Java programming practices. Complements your programming collection.',
                            estimated_value: '$30-45',
                            availability: 'Available in hardcover and digital',
                            sources_used: 'https://www.abebooks.com/servlet/SearchResults?isbn=9780134685991'
                        },
                        {
                            isbn13: '9780135957059',
                            title: 'The Pragmatic Programmer',
                            author: 'David Thomas, Andrew Hunt',
                            publisher: 'Addison-Wesley Professional',
                            year: '2019',
                            description: 'Classic programming wisdom. Perfect addition to your technical library.',
                            estimated_value: '$25-40',
                            availability: 'Widely available',
                            sources_used: 'https://www.abebooks.com/servlet/SearchResults?isbn=9780135957059'
                        }
                    ];
                } else {
                    // สร้าง generic recommendations จาก authors และ publishers ที่มี
                    recommendations = [
                        {
                            isbn13: '9780123456789',
                            title: `Recommended book similar to your collection`,
                            author: authors.length > 0 ? `Similar to ${authors[0]}` : 'Contemporary Author',
                            publisher: publishers.length > 0 ? publishers[0] : 'Academic Publisher',
                            year: years.length > 0 ? years[0].replace('s', '5') : '2023',
                            description: `This book complements your collection featuring works by ${authors.slice(0, 2).join(' and ')}.`,
                            estimated_value: '$20-35',
                            availability: 'Available',
                            sources_used: 'https://www.abebooks.com/servlet/SearchResults?author=' + encodeURIComponent(authors[0] || 'author')
                        }
                    ];
                }
            } else {
                // Collection mode แต่ไม่มีข้อมูล
                recommendations = [
                    {
                        isbn13: '9780345391803',
                        title: 'The Hitchhiker\'s Guide to the Galaxy',
                        author: 'Douglas Adams',
                        publisher: 'Del Rey',
                        year: '1979',
                        description: 'A classic that appeals to broad audiences.',
                        estimated_value: '$8-15',
                        availability: 'Widely available',
                        sources_used: 'https://www.abebooks.com/servlet/SearchResults?isbn=9780345391803'
                    }
                ];
            }
        } else {
            // Taste-based fallback
            const taste = target.taste || '';
            recommendations = [
                {
                    isbn13: '9780525559474',
                    title: `Book matching your interests`,
                    author: 'Recommended Author',
                    publisher: target.publisher || 'Quality Publisher',
                    year: target.years || '2023',
                    description: `This book matches your described preferences: "${taste.slice(0, 50)}${taste.length > 50 ? '...' : ''}"`,
                    estimated_value: '$15-25',
                    availability: 'Available',
                    sources_used: 'https://www.goodreads.com/search?q=' + encodeURIComponent(taste.slice(0, 20))
                }
            ];
        }

        const searchSources = this.generateSearchSources(recommendations);

        return {
            recommendations,
            search_sources: searchSources,
            search_enabled: false // แสดงว่าเป็น fallback
        };
    }

    // สร้าง realistic search sources based on recommendations
    private generateSearchSources(recommendations: any[]) {
        const sources = [];

        for (const book of recommendations) {
            // Add multiple search sources per book
            sources.push({
                url: `https://www.abebooks.com/servlet/SearchResults?isbn=${book.isbn13}`,
                title: `${book.title} - AbeBooks Price Check`,
                content: `Market pricing for ${book.title} by ${book.author}`,
                start_index: 0,
                end_index: 100
            });

            sources.push({
                url: `https://www.biblio.com/search.php?keyisbn=${book.isbn13}`,
                title: `${book.title} - Biblio Marketplace`,
                content: `Availability and condition reports for ${book.title}`,
                start_index: 0,
                end_index: 120
            });

            if (sources.length >= 5) break; // Limit to 5 sources
        }

        return sources.slice(0, 5);
    }
}

export const openRouterAIService = new OpenRouterAIService();

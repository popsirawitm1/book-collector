// services/aiRecommendationService.ts
class OpenRouterAIService {
    private apiKey: string;
    private baseUrl: string;

    constructor() {
        // ใส่ OpenRouter API Key ของคุณ
        this.apiKey = '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';
        this.baseUrl = 'https://openrouter.ai/api/v1';
    }

    async getRecommendations(mode: string, target: any) {
        const prompt = this.buildPrompt(mode, target);

        // เพิ่มโมเดลที่หลากหลายและมี fallback
        const strategies = [
            // Strategy 1: Native search models
            {
                models: [
                    'openai/gpt-4o-mini:online',
                    'openai/gpt-3.5-turbo:online',
                    'anthropic/claude-3.5-sonnet:online'
                ],
                useWebSearch: true,
                engine: 'native'
            },
            // Strategy 2: Exa search models
            {
                models: [
                    'openai/gpt-4o-mini',
                    'anthropic/claude-3.5-sonnet',
                    'openai/gpt-3.5-turbo'
                ],
                useWebSearch: true,
                engine: 'exa'
            },
            // Strategy 3: No web search (basic models)
            {
                models: [
                    'openai/gpt-4o-mini',
                    'anthropic/claude-3.5-sonnet',
                    'openai/gpt-3.5-turbo',
                    'meta-llama/llama-3.1-8b-instruct:free'
                ],
                useWebSearch: false,
                engine: null
            }
        ];

        for (const strategy of strategies) {
            console.log(`Trying strategy: ${strategy.engine || 'no-web-search'}, models: ${strategy.models.join(', ')}`);

            for (const model of strategy.models) {
                try {
                    console.log(`Attempting model: ${model}`);

                    const requestBody: any = {
                        model: model,
                        messages: [
                            {
                                role: 'system',
                                content: strategy.useWebSearch
                                    ? 'You are a book recommendation expert specializing in collectible and rare books. Use web search to find current market information and verify book details. Return only valid JSON format with accurate, up-to-date information.'
                                    : 'You are a book recommendation expert specializing in collectible and rare books. Use your knowledge to suggest books. Return only valid JSON format.'
                            },
                            {
                                role: 'user',
                                content: strategy.useWebSearch ? prompt : this.buildBasicPrompt(mode, target)
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: 1500,
                    };

                    // เพิ่ม web search configuration ถ้าใช้
                    if (strategy.useWebSearch) {
                        if (strategy.engine === 'native') {
                            requestBody.plugins = [
                                {
                                    id: "web",
                                    engine: "native",
                                    max_results: 5,
                                    search_prompt: `Book market search conducted on ${new Date().toLocaleDateString()}. Find current information about collectible books, availability, and market values.

IMPORTANT: Cite sources using markdown links.
Example: [goodreads.com](https://goodreads.com/book/123)`
                                }
                            ];
                            requestBody.web_search_options = {
                                search_context_size: "low"
                            };
                        } else if (strategy.engine === 'exa') {
                            requestBody.plugins = [
                                {
                                    id: "web",
                                    engine: "exa",
                                    max_results: 5,
                                }
                            ];
                        }
                    }

                    const response = await fetch(`${this.baseUrl}/chat/completions`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'https://book-collector-app.com',
                            'X-Title': 'Book Collector App',
                        },
                        body: JSON.stringify(requestBody),
                    });

                    console.log(`Response status: ${response.status}`);

                    if (response.ok) {
                        const data = await response.json();
                        console.log('API Response received successfully');

                        if (data.choices && data.choices[0] && data.choices[0].message) {
                            const aiMessage = data.choices[0].message;
                            const searchSources = this.extractWebSearchSources(aiMessage);

                            try {
                                // ลองแยก JSON จาก response
                                let jsonContent = aiMessage.content;

                                // หา JSON block ถ้ามี markdown formatting
                                const jsonMatch = jsonContent.match(/```json\n([\s\S]*?)\n```/) ||
                                    jsonContent.match(/```\n([\s\S]*?)\n```/) ||
                                    jsonContent.match(/\{[\s\S]*\}/);

                                if (jsonMatch) {
                                    jsonContent = jsonMatch[1] || jsonMatch[0];
                                }

                                const parsedContent = JSON.parse(jsonContent);
                                console.log('JSON parsed successfully');

                                return {
                                    ...parsedContent,
                                    search_sources: searchSources,
                                    search_enabled: strategy.useWebSearch,
                                    cost_optimized: strategy.engine === 'native' || !strategy.useWebSearch,
                                    model_used: model,
                                    strategy_used: strategy.engine || 'basic'
                                };
                            } catch (parseError) {
                                console.warn(`Failed to parse JSON from ${model}:`, parseError);
                                console.warn('Raw content:', aiMessage.content);
                                continue;
                            }
                        }
                    } else {
                        const errorText = await response.text();
                        console.warn(`Model ${model} failed with status ${response.status}:`, errorText);
                    }
                } catch (error) {
                    console.warn(`Model ${model} failed with error:`, error);
                    continue;
                }
            }
        }

        throw new Error('All AI models and strategies failed');
    }

    private extractWebSearchSources(message: any): any[] {
        if (!message.annotations) return [];

        return message.annotations
            .filter((annotation: any) => annotation.type === 'url_citation')
            .map((annotation: any) => ({
                url: annotation.url_citation.url,
                title: annotation.url_citation.title,
                content: annotation.url_citation.content,
                start_index: annotation.url_citation.start_index,
                end_index: annotation.url_citation.end_index
            }));
    }

    private buildPrompt(mode: string, target: any): string {
        let prompt = '';

        if (mode === 'AUTO') {
            prompt = `As a book collector expert, search the web for current information about collectible books similar to typical collection patterns. Find 5 books that are:
- Currently available or recently published
- Have strong collectible potential
- Are accurately priced in today's market`;
        } else {
            prompt = `Based on this specific preference: "${target.taste}", search the web for 5 books that match exactly. Use current market data and availability information.`;
        }

        // เพิ่ม filters พร้อมคำสั่งให้ search web
        if (target.years) prompt += ` Search for books published in year range: ${target.years}.`;
        if (target.publisher) prompt += ` Focus on publisher: ${target.publisher}.`;
        if (target.language) prompt += ` Language: ${target.language}.`;
        if (target.binding) prompt += ` Binding type: ${target.binding}.`;
        if (target.firstEdition) prompt += ` First editions only - verify current market availability.`;

        prompt += `

USE WEB SEARCH to verify all information and find current market data. Search for:
1. Book availability and current prices
2. Publisher information and editions
3. Collectible value and rarity
4. Recent sales or listings
5. Academic or collector reviews

Return JSON in this exact format:
{
  "recommendations": [
    {
      "isbn13": "978xxxxxxxxxx",
      "title": "Exact Book Title",
      "author": "Author Name", 
      "publisher": "Publisher Name",
      "year": "Publication Year",
      "description": "Description with current market value, availability, and collectible aspects based on web search results",
      "estimated_value": "Current market price range if found",
      "availability": "Current availability status",
      "sources_used": "Brief mention of key sources consulted"
    }
  ]
}

IMPORTANT: All book details must be verified through web search. Include real ISBN numbers, accurate publication data, and current market information.`;

        return prompt;
    }

    private buildBasicPrompt(mode: string, target: any): string {
        let prompt = '';

        if (mode === 'AUTO') {
            prompt = `As a book collector expert, recommend 5 collectible books based on typical collection patterns. Focus on books that are:
- Well-known collectibles with strong market presence
- From reputable publishers
- Have lasting value potential`;
        } else {
            prompt = `Based on this preference: "${target.taste}", recommend 5 books that match. Consider classic and contemporary titles.`;
        }

        // เพิ่ม filters
        if (target.years) prompt += ` Year range: ${target.years}.`;
        if (target.publisher) prompt += ` Publisher: ${target.publisher}.`;
        if (target.language) prompt += ` Language: ${target.language}.`;
        if (target.binding) prompt += ` Binding type: ${target.binding}.`;
        if (target.firstEdition) prompt += ` First editions preferred.`;

        prompt += `

Return JSON in this exact format:
{
  "recommendations": [
    {
      "isbn13": "978xxxxxxxxxx",
      "title": "Book Title",
      "author": "Author Name", 
      "publisher": "Publisher Name",
      "year": "Publication Year",
      "description": "Description focusing on collectible aspects and why it matches the criteria",
      "estimated_value": "Estimated value range",
      "availability": "General availability status"
    }
  ]
}

Focus on well-known, collectible books. Use realistic details.`;

        return prompt;
    }
}

export const openRouterAIService = new OpenRouterAIService();

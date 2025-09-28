import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Dimensions,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    buttons?: {
        text: string;
        onPress: () => void;
        style?: 'default' | 'cancel' | 'destructive';
    }[];
    onClose?: () => void;
}

const {width: screenWidth} = Dimensions.get('window');

export const CustomAlert: React.FC<CustomAlertProps> = ({
                                                            visible,
                                                            title,
                                                            message,
                                                            type = 'info',
                                                            buttons = [],
                                                            onClose,
                                                        }) => {
    const getIconName = () => {
        switch (type) {
            case 'success':
                return 'checkmark-circle';
            case 'error':
                return 'alert-circle';
            case 'warning':
                return 'warning';
            default:
                return 'information-circle';
        }
    };

    const getIconColor = () => {
        switch (type) {
            case 'success':
                return '#10b981';
            case 'error':
                return '#ef4444';
            case 'warning':
                return '#f59e0b';
            default:
                return '#3b82f6';
        }
    };

    const defaultButtons = buttons.length > 0 ? buttons : [
        {
            text: 'ตกลง', onPress: onClose || (() => {
            }), style: 'default' as const
        }
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={() => {
                    }}>
                        <View style={styles.alertContainer}>
                            <View style={styles.iconContainer}>
                                <Ionicons
                                    name={getIconName()}
                                    size={48}
                                    color={getIconColor()}
                                />
                            </View>

                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.message}>{message}</Text>

                            <View style={styles.buttonContainer}>
                                {defaultButtons.map((button, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.button,
                                            button.style === 'cancel' && styles.cancelButton,
                                            button.style === 'destructive' && styles.destructiveButton,
                                            defaultButtons.length === 1 && styles.singleButton,
                                        ]}
                                        onPress={button.onPress}
                                    >
                                        <Text
                                            style={[
                                                styles.buttonText,
                                                button.style === 'cancel' && styles.cancelButtonText,
                                                button.style === 'destructive' && styles.destructiveButtonText,
                                            ]}
                                        >
                                            {button.text}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    alertContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        width: screenWidth - 40,
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    iconContainer: {
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 8,
        justifyContent: 'center', // เพิ่มบรรทัดนี้
        alignItems: 'center',
    },
    button: {
        flex: 1,
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    singleButton: {
        flex: 0,
        minWidth: 100,
        alignSelf: 'center',
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    destructiveButton: {
        backgroundColor: '#ef4444',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#ffffff',
    },
    cancelButtonText: {
        color: '#6b7280',
    },
    destructiveButtonText: {
        color: '#ffffff',
    },
});

export default CustomAlert;

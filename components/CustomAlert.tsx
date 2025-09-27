import React from 'react';
import {Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message?: string;
    onClose: () => void;
    type?: 'error' | 'success' | 'warning';
}

const CustomAlert: React.FC<CustomAlertProps> = ({
                                                     visible,
                                                     title,
                                                     message,
                                                     onClose,
                                                     type = 'error'
                                                 }) => {
    const getIconName = () => {
        switch (type) {
            case 'success':
                return 'checkmark-circle';
            case 'warning':
                return 'warning';
            case 'error':
            default:
                return 'alert-circle';
        }
    };

    const getIconColor = () => {
        switch (type) {
            case 'success':
                return '#10B981';
            case 'warning':
                return '#F59E0B';
            case 'error':
            default:
                return '#EF4444';
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={getIconName()}
                            size={32}
                            color={getIconColor()}
                        />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    {message && <Text style={styles.message}>{message}</Text>}
                    <TouchableOpacity
                        style={[styles.button, {backgroundColor: getIconColor()}]}
                        onPress={onClose}
                    >
                        <Text style={styles.buttonText}>OK</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
    container: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        width: '100%',
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    iconContainer: {
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        minWidth: 120,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default CustomAlert;

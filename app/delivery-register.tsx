import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { 
  Truck,
  User,
  Phone,
  MapPin,
  CreditCard,
  MessageCircle,
  ChevronDown,
  X,
  Bike,
  Car,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useData } from '@/providers/DataProvider';
import { Branch } from '@/types';

type VehicleType = 'motorcycle' | 'bicycle' | 'car' | 'other';

export default function DeliveryRegisterScreen() {
  const router = useRouter();
  const { branches, registerDelivery } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [branchSelectorVisible, setBranchSelectorVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dni: '',
    address: '',
    vehicleType: 'motorcycle' as VehicleType,
    plateNumber: '',
    password: '',
    confirmPassword: '',
  });

  const vehicleOptions: { type: VehicleType; label: string; icon: any }[] = [
    { type: 'motorcycle', label: 'Motocicleta', icon: Bike },
    { type: 'bicycle', label: 'Bicicleta', icon: Bike },
    { type: 'car', label: 'Carro', icon: Car },
    { type: 'other', label: 'Otro', icon: Truck },
  ];

  const handleWhatsAppPress = () => {
    if (!selectedBranch) {
      Alert.alert(
        'Sucursal no seleccionada',
        'Es necesario seleccionar una sucursal para poder enviar la foto de la identidad vía WhatsApp'
      );
      return;
    }

    const whatsappNumber = selectedBranch.whatsapp.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hola, me gustaría enviar mi foto de identidad (DNI) para mi registro como repartidor.\n\nNombre: ${formData.name || '[Pendiente]'}\nDNI: ${formData.dni || '[Pendiente]'}\nTeléfono: ${formData.phone || '[Pendiente]'}`
    );
    const url = `https://wa.me/${whatsappNumber}?text=${message}`;
    Linking.openURL(url);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.dni || !formData.address || !formData.plateNumber || !formData.password) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (!selectedBranch) {
      Alert.alert('Error', 'Por favor selecciona una sucursal');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      await registerDelivery({
        name: formData.name,
        phone: formData.phone,
        dni: formData.dni,
        dniPhoto: 'pending',
        address: formData.address,
        vehicleType: formData.vehicleType,
        plateNumber: formData.plateNumber.toUpperCase(),
        password: formData.password,
        branchId: selectedBranch.id,
      });
      setSubmitted(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo completar el registro');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Registro de Repartidor' }} />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle size={80} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>¡Solicitud Enviada!</Text>
          <Text style={styles.successText}>
            Tu solicitud para unirte como repartidor ha sido enviada a la sucursal {selectedBranch?.name}. 
            Te contactaremos pronto para confirmar tu registro.
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Volver al Inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Registro de Repartidor' }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Truck size={32} color={Colors.primary} />
          </View>
          <Text style={styles.headerTitle}>¡Únete a nuestro equipo!</Text>
          <Text style={styles.headerSubtitle}>
            Completa el formulario para registrarte como repartidor de Fry Chicken
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre Completo *</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Tu nombre completo"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Número de DNI *</Text>
            <View style={styles.inputWrapper}>
              <CreditCard size={20} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={formData.dni}
                onChangeText={(text) => setFormData({ ...formData, dni: text })}
                placeholder="0801-1990-12345"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Teléfono *</Text>
            <View style={styles.inputWrapper}>
              <Phone size={20} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="+504 9999-9999"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Dirección *</Text>
            <View style={styles.inputWrapper}>
              <MapPin size={20} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Tu dirección completa"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Sucursal a la que deseas unirte *</Text>
            <TouchableOpacity 
              style={styles.branchSelector}
              onPress={() => setBranchSelectorVisible(true)}
            >
              <MapPin size={20} color={selectedBranch ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.branchSelectorText, !selectedBranch && styles.placeholderText]}>
                {selectedBranch?.name || 'Seleccionar sucursal'}
              </Text>
              <ChevronDown size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tipo de Vehículo *</Text>
            <View style={styles.vehicleSelector}>
              {vehicleOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = formData.vehicleType === option.type;
                return (
                  <TouchableOpacity
                    key={option.type}
                    style={[styles.vehicleOption, isSelected && styles.vehicleOptionActive]}
                    onPress={() => setFormData({ ...formData, vehicleType: option.type })}
                  >
                    <Icon size={24} color={isSelected ? Colors.primary : Colors.textMuted} />
                    <Text style={[styles.vehicleOptionText, isSelected && styles.vehicleOptionTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Número de Placa *</Text>
            <TextInput
              style={styles.inputSimple}
              value={formData.plateNumber}
              onChangeText={(text) => setFormData({ ...formData, plateNumber: text.toUpperCase() })}
              placeholder="ABC-1234"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Enviar Foto del DNI vía WhatsApp</Text>
            <TouchableOpacity 
              style={styles.whatsappButton} 
              onPress={handleWhatsAppPress}
            >
              <MessageCircle size={24} color="#25D366" />
              <View style={styles.whatsappButtonContent}>
                <Text style={styles.whatsappButtonTitle}>Enviar foto del DNI por WhatsApp</Text>
                <Text style={styles.whatsappButtonSubtitle}>
                  {selectedBranch 
                    ? `Contactar con ${selectedBranch.name}`
                    : 'Selecciona una sucursal primero'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color={Colors.textSecondary} />
                ) : (
                  <Eye size={20} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirmar Contraseña *</Text>
            <TextInput
              style={styles.inputSimple}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              placeholder="Repite tu contraseña"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Truck size={20} color={Colors.secondary} />
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Enviando...' : 'Enviar Solicitud'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Al enviar tu solicitud, aceptas que tus datos sean revisados por el equipo de Fry Chicken 
            para validar tu registro como repartidor.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={branchSelectorVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Sucursal</Text>
              <TouchableOpacity onPress={() => setBranchSelectorVisible(false)}>
                <X size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.branchList}>
              {branches.map((branch) => (
                <TouchableOpacity
                  key={branch.id}
                  style={[
                    styles.branchOption,
                    selectedBranch?.id === branch.id && styles.branchOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedBranch(branch);
                    setBranchSelectorVisible(false);
                  }}
                >
                  <View style={styles.branchOptionIcon}>
                    <MapPin size={20} color={selectedBranch?.id === branch.id ? Colors.primary : Colors.textSecondary} />
                  </View>
                  <View style={styles.branchOptionInfo}>
                    <Text style={[
                      styles.branchOptionName,
                      selectedBranch?.id === branch.id && styles.branchOptionNameSelected,
                    ]}>
                      {branch.name}
                    </Text>
                    <Text style={styles.branchOptionAddress}>{branch.address}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    padding: 24,
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputSimple: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  branchSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  branchSelectorText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  placeholderText: {
    color: Colors.textMuted,
  },
  vehicleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  vehicleOption: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 6,
  },
  vehicleOptionActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  vehicleOptionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  vehicleOptionTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#25D366',
    gap: 12,
  },
  whatsappButtonContent: {
    flex: 1,
  },
  whatsappButtonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  whatsappButtonSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  successText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  branchList: {
    padding: 16,
  },
  branchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  branchOptionSelected: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  branchOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchOptionInfo: {
    flex: 1,
  },
  branchOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  branchOptionNameSelected: {
    color: Colors.primary,
  },
  branchOptionAddress: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
});

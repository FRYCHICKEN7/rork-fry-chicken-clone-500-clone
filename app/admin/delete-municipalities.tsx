import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Trash2, AlertTriangle, Database } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { firebaseService } from '@/services/firebase-service';

export default function DeleteMunicipalitiesScreen() {
  const { colors } = useTheme();
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [deletionComplete, setDeletionComplete] = useState(false);

  const addStatus = (message: string) => {
    setStatusMessages(prev => [...prev, message]);
  };

  const handleDeleteMunicipalities = () => {
    Alert.alert(
      'Confirmar Eliminación',
      '⚠️ ADVERTENCIA: Esta acción eliminará TODOS los municipios de Firebase. Esta acción no se puede deshacer.\n\n¿Estás seguro de continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Todo',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            setStatusMessages([]);
            setDeletionComplete(false);

            try {
              addStatus('🔥 Conectando a Firebase...');
              
              const municipalities = await new Promise<any[]>((resolve) => {
                const unsubscribe = firebaseService.municipalities.getAll((data) => {
                  unsubscribe();
                  resolve(data);
                });
              });

              addStatus(`📊 Se encontraron ${municipalities.length} municipios`);
              
              if (municipalities.length === 0) {
                addStatus('✅ No hay municipios para eliminar');
                setDeletionComplete(true);
                Alert.alert('Información', 'No hay municipios en la base de datos');
                return;
              }

              addStatus('');
              addStatus('🗑️ Eliminando municipios...');

              let deletedCount = 0;
              for (const municipality of municipalities) {
                try {
                  await firebaseService.municipalities.delete(municipality.id);
                  deletedCount++;
                  addStatus(`✓ Eliminado: ${municipality.nombre} (${deletedCount}/${municipalities.length})`);
                } catch (error: any) {
                  addStatus(`✗ Error al eliminar ${municipality.nombre}: ${error.message}`);
                }
              }

              addStatus('');
              addStatus('🎉 ¡Eliminación completada!');
              addStatus(`📊 Resumen: ${deletedCount} municipios eliminados`);
              
              setDeletionComplete(true);
              
              setTimeout(() => {
                Alert.alert(
                  'Éxito',
                  `Se eliminaron ${deletedCount} municipios correctamente.`,
                  [{ text: 'OK' }]
                );
              }, 500);

            } catch (error: any) {
              console.error('❌ Error durante la eliminación:', error);
              addStatus('');
              addStatus('❌ ERROR: ' + (error.message || 'Error desconocido'));
              Alert.alert('Error', error.message || 'No se pudo completar la eliminación');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Eliminar Municipios' }} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Trash2 size={64} color={colors.error} />
          </View>
          <Text style={styles.title}>Eliminar Municipios de Firebase</Text>
          <Text style={styles.description}>
            Esta herramienta eliminará todos los municipios almacenados en Firebase Firestore.
          </Text>
        </View>

        <View style={styles.warningCard}>
          <AlertTriangle size={32} color={colors.error} />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>¡Advertencia!</Text>
            <Text style={styles.warningText}>
              • Esta acción eliminará TODOS los municipios de la base de datos{'\n'}
              • Esta acción NO se puede deshacer{'\n'}
              • Las sucursales NO se verán afectadas{'\n'}
              • Las zonas de envío NO se verán afectadas
            </Text>
          </View>
        </View>

        {statusMessages.length > 0 && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Database size={20} color={colors.primary} />
              <Text style={styles.statusTitle}>Estado de la Eliminación</Text>
            </View>
            <ScrollView style={styles.statusScroll} nestedScrollEnabled>
              {statusMessages.map((message, index) => (
                <Text key={index} style={styles.statusMessage}>
                  {message}
                </Text>
              ))}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.deleteButton,
            (isDeleting || deletionComplete) && styles.deleteButtonDisabled,
          ]}
          onPress={handleDeleteMunicipalities}
          disabled={isDeleting || deletionComplete}
          activeOpacity={0.7}
        >
          {isDeleting ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Trash2 size={20} color={colors.white} />
              <Text style={styles.deleteButtonText}>
                {deletionComplete ? 'Eliminación Completada' : 'Eliminar Todos los Municipios'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>¿Por qué eliminar los municipios?</Text>
          <Text style={styles.infoText}>
            • La app ya no usa municipios para filtrar sucursales{'\n'}
            • Los clientes ahora eligen directamente su sucursal después de iniciar sesión{'\n'}
            • Esto simplifica la experiencia del usuario{'\n'}
            • Eliminar los datos antiguos mantiene la base de datos limpia
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: 24,
      alignItems: 'center',
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.error + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 12,
    },
    description: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    warningCard: {
      flexDirection: 'row',
      backgroundColor: colors.error + '10',
      marginHorizontal: 16,
      marginBottom: 24,
      padding: 20,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.error + '30',
    },
    warningContent: {
      flex: 1,
      marginLeft: 16,
    },
    warningTitle: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.error,
      marginBottom: 8,
    },
    warningText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    statusCard: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginBottom: 24,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    statusTitle: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.textPrimary,
    },
    statusScroll: {
      maxHeight: 300,
    },
    statusMessage: {
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'monospace',
      lineHeight: 20,
      marginBottom: 4,
    },
    deleteButton: {
      backgroundColor: colors.error,
      marginHorizontal: 16,
      marginBottom: 24,
      padding: 18,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    deleteButtonDisabled: {
      opacity: 0.5,
    },
    deleteButtonText: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.white,
    },
    infoSection: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginBottom: 24,
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      marginBottom: 12,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    bottomPadding: {
      height: 32,
    },
  });

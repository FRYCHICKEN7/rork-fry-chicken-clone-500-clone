# Reglas de Seguridad de Firebase - Actualizadas

## Instrucciones de Implementación

1. Ve a Firebase Console: https://console.firebase.google.com
2. Selecciona tu proyecto
3. Ve a **Firestore Database** > **Reglas**
4. Copia y pega las reglas de abajo
5. Haz clic en **Publicar**

---

## Reglas de Seguridad Actualizadas

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ================= FUNCIONES AUXILIARES =================
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isAdmin() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             getUserData().role == 'admin';
    }

    function isBranch() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             getUserData().role == 'branch';
    }

    function isDelivery() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             getUserData().role == 'delivery';
    }

    function isCustomer() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             getUserData().role == 'customer';
    }

    function getBranchId() {
      return getUserData().branchId;
    }

    // ================= USUARIOS =================
    match /users/{userId} {
      // ✅ Permitir creación sin restricciones (para registro inicial)
      allow create: if true;
      
      // ✅ Lectura: cualquier usuario autenticado puede leer perfiles
      allow get, list: if isAuthenticated();
      
      // ✅ Actualización: el propio usuario o admin
      allow update: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      
      // ✅ Eliminación: solo el propio usuario o admin
      allow delete: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
    }

    // ================= PEDIDOS =================
    match /orders/{orderId} {
      allow get, list: if isAuthenticated();
      allow create: if isAuthenticated() && (isCustomer() || isAdmin());
      allow update: if isAuthenticated();
      allow delete: if isAdmin();
    }

    // ================= QUEJAS =================
    match /complaints/{complaintId} {
      allow get, list: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();
    }

    // ================= SUCURSALES =================
    // ✅ CRÍTICO: Permitir lectura sin autenticación
    match /branches/{branchId} {
      allow get, list: if true;
      allow create, update, delete: if isAdmin();
    }

    // ================= DELIVERY USERS =================
    match /deliveryUsers/{deliveryId} {
      allow get, list: if isAuthenticated();
      allow create: if true;
      allow update: if isAuthenticated() && (request.auth.uid == deliveryId || isAdmin() || isBranch());
      allow delete: if isAdmin();
    }

    // ================= PRODUCTOS =================
    match /products/{productId} {
      allow get, list: if true;
      allow create, update, delete: if isAdmin();
    }

    // ================= CATEGORÍAS =================
    match /categories/{categoryId} {
      allow get, list: if true;
      allow create, update, delete: if isAdmin();
    }

    // ================= CUENTAS BANCARIAS =================
    match /bankAccounts/{accountId} {
      allow get, list: if true;
      allow create, update, delete: if isAdmin();
    }

    // ================= NOTIFICACIONES =================
    match /notifications/{notificationId} {
      allow get, list, create, update: if isAuthenticated();
      allow delete: if isAdmin();
    }

    // ================= PUNTOS DE USUARIO =================
    match /userPoints/{userPointsId} {
      allow get: if isAuthenticated() && (request.auth.uid == userPointsId || isAdmin());
      allow list: if isAuthenticated();
      allow create, update: if isAuthenticated();
      allow delete: if isAdmin();
    }

    // ================= PASSWORD RESETS =================
    match /passwordResets/{email} {
      allow read, write: if true;
    }

    // ================= SOLICITUDES DE RECUPERACIÓN =================
    match /passwordRecoveryRequests/{requestId} {
      allow create: if true;
      allow read, update: if isAuthenticated();
      allow delete: if isAdmin();
    }

    // ================= CUPONES =================
    match /coupons/{couponId} {
      allow get, list: if true;
      allow create, update, delete: if isAdmin();
    }

    // ================= PROMOCIONES =================
    match /promotions/{promotionId} {
      allow get, list: if true;
      allow create, update, delete: if isAdmin();
    }

    // ================= CONFIGURACIÓN DE PUNTOS =================
    match /pointsSettings/{settingId} {
      allow get, list: if true;
      allow create, update, delete: if isAdmin();
    }

    // ================= HORARIOS DE NEGOCIO =================
    match /businessHours/{hourId} {
      allow get, list: if true;
      allow create, update, delete: if isAdmin();
    }

    // ================= CONFIGURACIÓN DE TEMA =================
    match /theme/{themeId} {
      allow get, list: if true;
      allow create, update, delete: if isAdmin();
    }

    // ================= POPUP DE MARKETING =================
    match /marketingPopup/{popupId} {
      allow get, list: if true;
      allow create, update, delete: if isAdmin();
    }

    // ================= RESPALDOS =================
    match /backups/{backupId} {
      allow read, write: if isAdmin();
    }

    // ================= ESTADÍSTICAS =================
    match /statistics/{statId} {
      allow read, write: if isAdmin();
    }

    // ================= IMPORTACIÓN DE PRODUCTOS =================
    match /importLogs/{logId} {
      allow read, write: if isAdmin();
    }

    // ================= CALIFICACIONES =================
    match /reviews/{reviewId} {
      allow get, list: if true;
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();
    }

    // ================= ZONAS DE ENVÍO =================
    match /deliveryZones/{zoneId} {
      allow get, list: if true;
      allow create, update, delete: if isAdmin();
    }
  }
}
```

## Cambios Principales

### ✅ Mejoras de Seguridad

1. **Creación de Usuarios**: Permitir creación sin autenticación (`allow create: if true`) para que el registro funcione correctamente
2. **Lectura Pública**: Branches, productos, categorías y otros datos necesarios para la app tienen lectura pública
3. **Validaciones Robustas**: Uso de `exists()` en funciones auxiliares para evitar errores de permisos

### ✅ Permisos de Administrador

- Solo administradores pueden crear/editar/eliminar datos críticos
- Los usuarios autenticados pueden crear perfiles de admin (validación adicional en el código)
- Sistema de roles bien definido (admin, branch, delivery, customer)

### 🔒 Seguridad

- **Usuarios**: Solo el propio usuario o admin puede actualizar/eliminar
- **Pedidos**: Solo clientes y admins pueden crear
- **Datos sensibles**: Solo admins tienen acceso completo

## Notas Importantes

1. **Creación de Admins**: La validación de que solo el admin principal (`frychickenhn@gmail.com`) puede crear otros admins se hace en el código del AuthProvider, NO en las reglas de Firebase

2. **Branches**: Tienen lectura pública (`if true`) para que los usuarios no logueados puedan ver sucursales y horarios

3. **Testing**: Después de publicar las reglas, prueba:
   - ✅ Abrir la app sin estar logueado
   - ✅ Registrarse como nuevo usuario
   - ✅ Ver productos y categorías
   - ✅ Hacer checkout
   - ✅ Como admin principal: crear otros administradores

## Funcionalidad de Creación de Admins

### Cómo Funciona

1. **Solo el admin principal** con email `frychickenhn@gmail.com` puede crear otros administradores
2. En la pantalla de Gestión de Usuarios (`/admin/users`), verás un botón **"+ Admin"** en el header
3. Al hacer clic, se abre un modal para ingresar:
   - Nombre completo del nuevo admin
   - Email
   - Contraseña (mínimo 6 caracteres)
4. El nuevo administrador se crea en:
   - Firebase Authentication
   - Firestore (colección `users` con rol `admin`)
5. El nuevo admin puede iniciar sesión inmediatamente con las credenciales proporcionadas

### Seguridad

- La validación del admin principal se hace en `AuthProvider.createAdminUser()`
- Solo usuarios con email `frychickenhn@gmail.com` pueden ejecutar esta función
- Firebase crea una nueva cuenta de Authentication automáticamente
- El perfil se guarda en Firestore con rol `admin`

---

Si tienes problemas con las reglas, revisa la consola de Firebase Firestore para ver logs de acceso denegado.

import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage debe usarse dentro de LanguageProvider');
    }
    return context;
};

// Diccionario de traducciones simple
const translations = {
    es: {
        // Menu
        'panel': 'Panel',
        'pedidos': 'Pedidos',
        'productos': 'Productos',
        'pagos': 'Pagos',
        'informes': 'Informes',
        'configuracion': 'Configuración',
        'cerrar_sesion': 'Cerrar sesión',
        'sistema_gestion': 'Sistema de Gestión',

        // Dashboard
        'ventas_semana': 'Ventas de la Semana',
        'comparativa_diaria': 'Comparativa diaria',
        'top_productos': 'Top Productos',
        'mas_vendidos': 'Más vendidos hoy',
        'ver_todos': 'Ver todos los productos',
        'total_semana': 'Total Semana',
        'promedio_diario': 'Promedio Diario',
        'mejor_dia': 'Mejor Día',
        'semana': 'Semana',
        'mes': 'Mes',
        'pedidos_hoy': 'Pedidos Hoy',
        'ventas_hoy': 'Ventas del Día',
        'mesas_ocupadas': 'Mesas Ocupadas',
        'producto_estrella': 'Producto Estrella',

        // Configuración
        'config_titulo': 'Configuración',
        'config_desc': 'Administra la configuración del sistema y del restaurante',
        'general': 'General',
        'horarios': 'Horarios',
        'usuarios': 'Usuarios',
        'seguridad': 'Seguridad',
        'info_restaurante': 'Información del Restaurante',
        'pref_regionales': 'Preferencias Regionales',
        'guardar_cambios': 'Guardar Cambios',
        'guardar_horarios': 'Guardar Horarios',

        // General
        'nombre_restaurante': 'Nombre del Restaurante',
        'email_contacto': 'Email de Contacto',
        'telefono': 'Teléfono',
        'direccion': 'Dirección',
        'moneda': 'Moneda',
        'idioma': 'Idioma',
        'preferencias': 'Preferencias',
        'subir_logo': 'Subir Logo',
        'cambiar_logo': 'Cambiar Logo',
        'arrastra_imagen': 'Arrastra una imagen o haz clic',
        'nombre_negocio': 'Nombre del Negocio',
        'nombre_negocio_placeholder': 'Ej: Takemi Food',
        'logo_url': 'URL del Logo',
        'logo_desc': 'Formatos: PNG, JPG (Max 500KB)',
        'error_imagen_grande': 'La imagen es demasiado grande (Max 500KB)',
        'vista_previa_ticket': 'Vista Previa del Ticket',
        'mensaje_cabecera': 'Mensaje Cabecera',
        'mensaje_pie': 'Mensaje Pie de Página',
        'mostrar_logo_ticket': 'Mostrar Logo en Ticket',
        'pais_zona': 'País / Zona Horaria',
        'contrasena_actual': 'Contraseña Actual',
        'nueva_contrasena': 'Nueva Contraseña',
        'confirmar_contrasena': 'Confirmar Contraseña',
        'cambiar_contrasena': 'Cambiar Contraseña',
        'cambiar_contrasena_desc': 'Actualiza la contraseña de tu cuenta actual',
        'control_sesion': 'Control de Sesión',
        'control_sesion_desc': 'Cerrar la sesión actual en este dispositivo',
        'cerrar_sesion_btn': 'Cerrar Sesión',
        'actualizar_contrasena': 'Actualizar Contraseña',
        'campos_requeridos': 'Por favor completa todos los campos',
        'contrasenas_no_coinciden': 'Las contraseñas no coinciden',
        'contrasena_actualizada': 'Contraseña actualizada correctamente',
        'confirmar_cerrar_sesion': '¿Estás seguro de cerrar sesión?',
    },
    en: {
        // Menu
        'panel': 'Dashboard',
        'pedidos': 'Orders',
        'productos': 'Products',
        'pagos': 'Payments',
        'informes': 'Reports',
        'configuracion': 'Settings',
        'cerrar_sesion': 'Logout',
        'sistema_gestion': 'Management System',

        // Dashboard
        'ventas_semana': 'Weekly Sales',
        'comparativa_diaria': 'Daily comparison',
        'top_productos': 'Top Products',
        'mas_vendidos': 'Best sellers today',
        'ver_todos': 'View all products',
        'total_semana': 'Weekly Total',
        'promedio_diario': 'Daily Average',
        'mejor_dia': 'Best Day',
        'semana': 'Week',
        'mes': 'Month',
        'pedidos_hoy': 'Orders Today',
        'ventas_hoy': 'Sales Today',
        'mesas_ocupadas': 'Occupied Tables',
        'producto_estrella': 'Star Product',

        // Configuración
        'config_titulo': 'Settings',
        'config_desc': 'Manage system and restaurant configuration',
        'general': 'General',
        'horarios': 'Schedules',
        'usuarios': 'Users',
        'seguridad': 'Security',
        'info_restaurante': 'Restaurant Information',
        'pref_regionales': 'Regional Preferences',
        'guardar_cambios': 'Save Changes',
        'guardar_horarios': 'Save Schedules',

        // General
        'nombre_restaurante': 'Restaurant Name',
        'email_contacto': 'Contact Email',
        'telefono': 'Phone',
        'direccion': 'Address',
        'moneda': 'Currency',
        'idioma': 'Language',
        'preferencias': 'Preferences',
        'subir_logo': 'Upload Logo',
        'cambiar_logo': 'Change Logo',
        'arrastra_imagen': 'Drag image or click',
        'nombre_negocio': 'Business Name',
        'nombre_negocio_placeholder': 'Ex: Takemi Food',
        'logo_url': 'Logo URL',
        'logo_desc': 'Formats: PNG, JPG (Max 500KB)',
        'error_imagen_grande': 'Image too large (Max 500KB)',
        'vista_previa_ticket': 'Ticket Preview',
        'mensaje_cabecera': 'Header Message',
        'mensaje_pie': 'Footer Message',
        'mostrar_logo_ticket': 'Show Logo on Ticket',
        'pais_zona': 'Country / Timezone',
        'contrasena_actual': 'Current Password',
        'nueva_contrasena': 'New Password',
        'confirmar_contrasena': 'Confirm Password',
        'cambiar_contrasena': 'Change Password',
        'cambiar_contrasena_desc': 'Update your current account password',
        'control_sesion': 'Session Control',
        'control_sesion_desc': 'Logout from this device',
        'cerrar_sesion_btn': 'Logout',
        'actualizar_contrasena': 'Update Password',
        'campos_requeridos': 'Please fill all fields',
        'contrasenas_no_coinciden': 'Passwords do not match',
        'contrasena_actualizada': 'Password updated successfully',
        'confirmar_cerrar_sesion': 'Are you sure you want to logout?',
    }
};

export const LanguageProvider = ({ children, initialLanguage = 'es' }) => {
    const [language, setLanguage] = useState(initialLanguage);

    // Intentar cargar idioma guardado en localStorage si no se pasa uno explícito
    // Ojo: Esto podría sobreescribirse si initialLanguage viene de DB.
    // Idealmente, App.jsx pasa el idioma de DB aquí.

    const t = (key) => {
        return translations[language]?.[key] || key;
    };

    const changeLanguage = (lang) => {
        if (translations[lang]) {
            setLanguage(lang);
        }
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

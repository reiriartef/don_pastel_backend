# Diagramas UML en Español - Sistema Don Pastel

Este documento contiene la descripción de todos los diagramas UML traducidos al español para el sistema backend de Don Pastel.

## 📊 Archivos Generados en Español

### 1. Diagrama de Objetos
**Archivo PNG:** `Sistema_Don_Pastel_Diagrama_de_Objetos.png`
**Código fuente:** `object-diagram-es.puml`

**Descripción:** Muestra un ejemplo concreto de instancias del sistema en tiempo de ejecución, representando un escenario real con datos específicos.

**Escenario representado:**
- **Cliente:** maria_lopez (user_id: 3) con dos órdenes activas
- **Orden #101:** Completada y pagada
  - 2x Pastel Chocolate ($15.00 cada uno)
  - 1x Pastel Vainilla ($12.00)
  - Total: $45.50 (pagado en efectivo)
  - Estado: Entregado
- **Orden #102:** En proceso
  - 1x Tarta Fresa ($18.50)
  - Estado: En preparación
  - Pago: Pendiente

**Componentes del diagrama:**
- **Usuarios del Sistema:** 3 usuarios con diferentes roles (Gerente, Cajero, Cliente)
- **Catálogo de Productos:** 3 productos disponibles
- **Gestión de Inventario:** Estado actual de stock con alerta de stock bajo
- **Órdenes y Items:** 2 órdenes con sus respectivos items
- **Pagos Registrados:** Pago completado para orden #101
- **Sesiones de Autenticación:** 2 tokens JWT activos

**Relaciones mostradas:**
- Usuario → Órdenes (realiza)
- Orden ◆→ Items (composición)
- Items ---> Productos (referencia)
- Inventario -- Productos (controla stock de)
- Pago -- Orden (corresponde a)
- Token JWT ---> Usuario (autentica a)

**Características destacadas:**
- Valores reales de instancias
- Alerta de stock bajo (Pastel Vainilla: 8 unidades)
- Estados de máquina de estados (pendiente, en_preparacion, entregado)
- Tokens JWT con timestamps de expiración
- Constraints aplicados (stock_level >= 0, UNIQUE payment per order)

---

### 2. Diagrama de Secuencia
**Archivo PNG:** `Sistema_Don_Pastel_Diagramas_de_Secuencia.png`
**Código fuente:** `sequence-diagram-es.puml`

**Descripción:** Muestra las interacciones temporales entre componentes para los 7 flujos principales del sistema.

**Flujos incluidos:**
1. **Flujo de Autenticación**
   - Login con validación de credenciales
   - Comparación de hash bcrypt
   - Generación de token JWT con expiración de 2 horas

2. **Flujo de Gestión de Productos (Solo Gerente)**
   - Autenticación mediante JWT
   - Validación de rol de gerente
   - Creación de productos en base de datos

3. **Flujo de Creación de Órdenes (Con Transacción)**
   - Inicio de transacción
   - Bloqueo de filas de inventario (FOR UPDATE)
   - Validación de stock disponible
   - Rollback automático si hay stock insuficiente

4. **Flujo de Actualización de Estado de Orden (Máquina de Estados)**
   - Estados: pendiente → en_preparacion → listo → entregado
   - Solo accesible para cajero y gerente

5. **Flujo de Registro de Pago**
   - Transacción con bloqueo de orden
   - Prevención de pagos duplicados
   - Validación de permisos para clientes

6. **Flujo de Generación de Reporte de Ventas**
   - Solo gerentes
   - Filtrado por período (diario, semanal, mensual)
   - Top 5 productos más vendidos

7. **Flujo de Alerta de Inventario Bajo**
   - Consulta de productos por debajo del umbral
   - Solo accesible para gerentes

---

### 3. Diagrama de Colaboración
**Archivo PNG:** `Sistema_Don_Pastel_Diagrama_de_Colaboracion.png`
**Código fuente:** `collaboration-diagram-es.puml`

**Descripción:** Diagrama de comunicación que muestra la estructura de objetos y sus relaciones durante el flujo de creación de órdenes.

**Objetos participantes:**
- Cliente (actor)
- API Gateway (/api/orders)
- Middleware Auth
- Controlador Order
- Pool de Conexiones BD
- Gestor de Transacciones
- Tablas: Inventory, Orders, Order_Items, Products

**Características destacadas:**
- 29 mensajes numerados secuencialmente
- Muestra el flujo completo de transacción
- Incluye notas sobre propiedades ACID
- Explica el bloqueo FOR UPDATE
- Describe roles de usuarios y permisos

---

### 4. Diagrama de Vista de Interacción
**Archivo PNG:** `Sistema_Don_Pastel_Diagrama_de_Vista_de_Interaccion.png`
**Código fuente:** `interaction-overview-diagram-es.puml`

**Descripción:** Vista de alto nivel del flujo completo de procesamiento de órdenes, combinando elementos de actividad y secuencia.

**Particiones principales:**
1. **Autenticación y Autorización**
   - Validación de JWT token
   - Verificación de permisos por rol

2. **Proceso de Creación de Orden**
   - Transacciones con fork paralelo
   - Validación de stock
   - Operaciones de base de datos concurrentes

3. **Actualizaciones de Estado de Orden (Ciclo de Vida)**
   - Máquina de estados con repeat loop
   - Switch por estado nuevo

4. **Procesamiento de Pagos**
   - Transacciones con bloqueos
   - Validación de permisos por rol

5. **Generación de Reportes (Gerente)**
   - Agregaciones fork paralelas
   - Solo para gerentes

**Patrones de diseño destacados:**
- Patrón de Transacción
- Patrón de Máquina de Estados
- Control de Acceso Basado en Roles
- Patrón de Bloqueo de Filas

---

### 5. Diagramas de Tiempo y Estado
**Archivo PNG:** `Sistema_Don_Pastel_Diagramas_de_Tiempo_y_Estado.png`
**Código fuente:** `timing-state-diagram-es.puml`

**Descripción:** Combina múltiples máquinas de estado que representan diferentes aspectos del sistema.

**Máquinas de estado incluidas:**

#### 4.1 Máquina de Estados de Orden
- **Pendiente** → **En_Preparacion** → **Listo** → **Entregado**
- Transiciones unidireccionales (sin retroceso)
- Solo cajero y gerente pueden actualizar

#### 4.2 Máquina de Estados de Pago
- **Sin_Pago** → **Pago_Iniciado** → **Pago_Completado**
- **Pago_Fallido** permite reintentos
- Estado final inmutable

#### 4.3 Ciclo de Vida de Token JWT
- **No_Autenticado** → **Autenticando** → **Token_Emitido** → **Autenticado**
- **Token_Expirado** después de 2 horas
- Stateless (no almacena sesión)

#### 4.4 Gestión de Estado de Inventario
- **Stock_Normal** (stock_level >= threshold)
- **Stock_Bajo** (0 < stock_level < threshold)
- **Sin_Stock** (stock_level = 0)
- Transiciones basadas en órdenes y actualizaciones manuales

#### 4.5 Estado de Registro de Usuario
- **Sin_Registrar** → **Registro_Iniciado** → **Hashing_Password** → **Usuario_Creado**
- Solo gerente puede crear usuarios
- Hashing bcrypt con cost 10

---

## 🔄 Comparación: Versiones en Inglés vs Español

### Archivos en Inglés (originales)
- `Don Pastel System - Sequence Diagrams.png`
- `Don Pastel System - Collaboration Diagram.png`
- `Don Pastel System - Interaction Overview Diagram.png`
- `Don Pastel System - Timing and State Diagrams.png`

### Archivos en Español (traducidos)
- `Sistema_Don_Pastel_Diagrama_de_Objetos.png` ⭐ **NUEVO**
- `Sistema_Don_Pastel_Diagramas_de_Secuencia.png`
- `Sistema_Don_Pastel_Diagrama_de_Colaboracion.png`
- `Sistema_Don_Pastel_Diagrama_de_Vista_de_Interaccion.png`
- `Sistema_Don_Pastel_Diagramas_de_Tiempo_y_Estado.png`

**Nota:** Los elementos técnicos como rutas de API, nombres de variables, tablas de base de datos y código SQL se mantienen en inglés. Solo se tradujeron:
- Títulos de diagramas
- Nombres de actores y participantes
- Descripciones y notas
- Mensajes de error y estados
- Texto explicativo

---

## 🛠️ Cómo Regenerar los Diagramas

Si necesitas modificar los diagramas en español:

1. Edita el archivo `.puml` correspondiente con sufijo `-es`
2. Ejecuta el comando:
   ```bash
   java -jar plantuml.jar -tpng <nombre-archivo>-es.puml
   ```

**Ejemplo:**
```bash
java -jar plantuml.jar -tpng sequence-diagram-es.puml
```

**Para regenerar todos los diagramas en español a la vez:**
```bash
java -jar plantuml.jar -tpng sequence-diagram-es.puml collaboration-diagram-es.puml interaction-overview-diagram-es.puml timing-state-diagram-es.puml
```

---

## 📋 Elementos Traducidos vs No Traducidos

### ✅ Traducidos al español:
- Títulos de diagramas y secciones
- Nombres de actores (Cliente, Gerente, Cajero, Usuario)
- Nombres de componentes (Middleware, Controlador, Base de Datos)
- Estados (Pendiente, En_Preparacion, Listo, Entregado)
- Descripciones de acciones (Validar, Verificar, Actualizar, etc.)
- Mensajes de error y respuestas HTTP descriptivas
- Notas explicativas y comentarios

### ❌ Mantenidos en inglés:
- Rutas de API (`/api/orders`, `/api/payments`, etc.)
- Nombres de métodos (`authRequired()`, `createOrder()`, etc.)
- Nombres de parámetros (`req`, `res`, `next`, `user_id`, etc.)
- Consultas SQL (`SELECT`, `INSERT`, `UPDATE`, `WHERE`, etc.)
- Nombres de tablas (`orders`, `payments`, `inventory`, `users`, etc.)
- Nombres de variables y propiedades (`token`, `order_id`, `stock_level`, etc.)
- Comandos de transacción (`BEGIN TRANSACTION`, `COMMIT`, `ROLLBACK`)
- Códigos de estado HTTP (`200 OK`, `201 Created`, `400 Bad Request`, etc.)
- Palabras clave técnicas (`FOR UPDATE`, `RETURNING`, `UNIQUE constraint`)

---

## 🎯 Uso Recomendado

**Para documentación académica en español:**
Use los archivos con prefijo `Sistema_Don_Pastel_*`

**Para documentación técnica internacional:**
Use los archivos con prefijo `Don Pastel System -*`

**Para presentaciones bilingües:**
Incluya ambas versiones para mejor comprensión

---

## 📊 Características Técnicas

- **Formato:** PNG de alta resolución
- **Herramienta:** PlantUML v1.2024.7
- **Especificación:** UML 2.5
- **Codificación:** UTF-8
- **Tamaño promedio:** 200-400 KB por diagrama

---

## 🔍 Patrones de Diseño Identificados

1. **Patrón MVC (Model-View-Controller)**
   - Separación de rutas, controladores y modelos

2. **Patrón de Transacción**
   - Operaciones atómicas (todo o nada)
   - Usado en creación de órdenes y pagos

3. **Patrón de Máquina de Estados**
   - Validación de transiciones de estado
   - Previene estados inválidos

4. **Patrón RBAC (Control de Acceso Basado en Roles)**
   - Middleware de autorización por roles
   - Tres roles: gerente, cajero, cliente

5. **Patrón de Bloqueo de Filas**
   - SELECT FOR UPDATE previene condiciones de carrera
   - Aislamiento de transacciones concurrentes

6. **Patrón Repository**
   - Abstracción de acceso a datos
   - Pool de conexiones reutilizables

---

## 📦 Resumen del Sistema

**Don Pastel Backend** es un sistema de gestión para una pastelería que incluye:

- ✅ Autenticación y autorización con JWT y bcrypt
- ✅ Gestión de productos (CRUD completo)
- ✅ Control de inventario con alertas de stock bajo
- ✅ Sistema de órdenes con máquina de estados
- ✅ Procesamiento de pagos con prevención de duplicados
- ✅ Reportes de ventas con agregaciones y análisis
- ✅ Control de acceso basado en roles

**Base de datos:** PostgreSQL
**Tablas:** users, products, inventory, orders, order_items, payments

---

**Fecha de generación:** 2025-10-16
**Versión del sistema:** 1.0.0
**Idioma:** Español (ES)

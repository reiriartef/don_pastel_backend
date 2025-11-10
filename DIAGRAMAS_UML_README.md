# Diagramas UML - Sistema Don Pastel

Este documento contiene la descripción de todos los diagramas UML generados para el sistema backend de Don Pastel.

## Archivos Generados

### 1. Diagrama de Secuencia (Sequence Diagram)
**Archivo:** `Don Pastel System - Sequence Diagrams.png`
**Código fuente:** `sequence-diagram.puml`

Este diagrama muestra las interacciones temporales entre los diferentes componentes del sistema para los 7 flujos principales:

1. **Flujo de Autenticación**
   - Proceso de login con validación de credenciales
   - Comparación de hash bcrypt
   - Generación de token JWT con expiración de 2 horas
   - Manejo de errores 401 para credenciales inválidas

2. **Gestión de Productos (Solo Gerente)**
   - Autenticación mediante JWT
   - Validación de rol de gerente
   - Creación de productos en base de datos
   - Respuesta con código 201 Created

3. **Creación de Órdenes (Con Transacciones)**
   - Inicio de transacción para garantizar atomicidad
   - Bloqueo de filas de inventario (FOR UPDATE) para evitar condiciones de carrera
   - Validación de stock disponible
   - Inserción de orden y order_items
   - Decremento atómico de inventario
   - Rollback automático si hay stock insuficiente
   - Commit solo cuando todas las validaciones pasan

4. **Actualización de Estado de Órdenes**
   - Implementación de máquina de estados
   - Validación de transiciones válidas
   - Estados: `pendiente` → `en_preparacion` → `listo` → `entregado`
   - Solo accesible para roles cajero y gerente

5. **Registro de Pagos**
   - Transacción con bloqueo de orden (FOR UPDATE)
   - Prevención de pagos duplicados mediante constraint UNIQUE
   - Validación de permisos para clientes (solo pueden pagar sus propias órdenes)
   - Rollback en caso de conflictos

6. **Generación de Reportes de Ventas**
   - Solo accesible para gerentes
   - Filtrado por período (diario, semanal, mensual)
   - Agregaciones de ventas totales
   - Desglose por métodos de pago
   - Top 5 productos más vendidos

7. **Alertas de Inventario Bajo**
   - Consulta de productos por debajo del umbral configurable
   - Solo accesible para gerentes
   - Usado para alertas de reabastecimiento

---

### 2. Diagrama de Colaboración (Collaboration/Communication Diagram)
**Archivo:** `Don Pastel System - Collaboration Diagram.png`
**Código fuente:** `collaboration-diagram.puml`

Este diagrama muestra la estructura de objetos y sus relaciones durante el flujo de creación de órdenes, enfocándose en:

- **Objetos participantes:**
  - Cliente (actor)
  - API Gateway
  - Auth Middleware
  - Order Controller
  - Database Connection Pool
  - Transaction Manager
  - Tablas: Inventory, Orders, Order_Items, Products

- **Mensajes numerados secuencialmente (1-29):**
  - Muestra el orden de las interacciones
  - Incluye autenticación, validación, transacciones
  - Bloqueo de filas y commit de cambios

- **Notas importantes:**
  - Explicación de las propiedades ACID de transacciones
  - Descripción del bloqueo FOR UPDATE
  - Roles de usuarios y permisos

---

### 3. Diagrama de Vista de Interacción (Interaction Overview Diagram)
**Archivo:** `Don Pastel System - Interaction Overview Diagram.png`
**Código fuente:** `interaction-overview-diagram.puml`

Este diagrama proporciona una vista de alto nivel del flujo completo de procesamiento de órdenes, combinando:

- **Particiones principales:**
  1. **Authentication & Authorization**
     - Validación de JWT token
     - Verificación de permisos por rol
     - Manejo de errores 401/403

  2. **Order Creation Process**
     - Transacciones con fork paralelo
     - Validación de stock
     - Operaciones de base de datos concurrentes
     - Decisiones basadas en disponibilidad

  3. **Order Status Updates (Lifecycle)**
     - Máquina de estados con repeat loop
     - Transiciones válidas
     - Switch por estado nuevo

  4. **Payment Processing**
     - Transacciones con bloqueos
     - Validación de permisos por rol
     - Prevención de duplicados

  5. **Reports Generation**
     - Agregaciones fork paralelas
     - Solo para gerentes

- **Patrones de diseño destacados:**
  - Transaction Pattern
  - State Machine Pattern
  - Role-Based Access Control
  - Row Locking Pattern

---

### 4. Diagrama de Tiempo y Estado (Timing and State Diagram)
**Archivo:** `Don Pastel System - Timing and State Diagrams.png`
**Código fuente:** `timing-state-diagram.puml`

Este diagrama combina múltiples máquinas de estado que representan diferentes aspectos del sistema:

#### 4.1 Order State Machine
Estados del ciclo de vida de una orden:
- **Pendiente** → **En_Preparacion** → **Listo** → **Entregado**
- Transiciones unidireccionales (sin retroceso)
- Solo cajero y gerente pueden actualizar
- Cada estado tiene acciones entry/do/exit

#### 4.2 Payment State Machine
Estados del proceso de pago:
- **No_Payment** → **Payment_Initiated** → **Payment_Completed**
- **Payment_Failed** permite reintentos
- Constraint UNIQUE previene duplicados
- Estado final inmutable

#### 4.3 JWT Token Lifecycle
Ciclo de vida de la autenticación:
- **Not_Authenticated** → **Authenticating** → **Token_Issued** → **Authenticated**
- **Token_Expired** después de 2 horas
- Stateless (no almacena sesión en servidor)
- Reintentos permitidos en Authentication_Failed

#### 4.4 Inventory State Management
Estados dinámicos de inventario:
- **Normal_Stock** (stock_level >= threshold)
- **Low_Stock** (0 < stock_level < threshold)
- **Out_Of_Stock** (stock_level = 0)
- Transiciones basadas en decrementos por órdenes y actualizaciones manuales
- Actualización atómica con timestamp last_updated

#### 4.5 User Registration State
Proceso de registro de usuarios:
- **Unregistered** → **Registration_Initiated** → **Password_Hashing** → **User_Created**
- Solo gerente puede crear usuarios
- Validación de unicidad de username
- Hashing bcrypt con cost 10

#### Características de Timing
- JWT Token: expiración de 2 horas (JWT_EXPIRES)
- Transaction Timeout: según pool de conexiones
- Low Stock Threshold: 10 unidades (configurable)
- Ciclo de vida de orden: minutos a horas

---

## Tecnologías y Herramientas

- **PlantUML**: Herramienta de generación de diagramas UML
- **Java Runtime**: Necesario para ejecutar PlantUML
- **Formato de salida**: PNG de alta resolución

## Patrones de Diseño Identificados

1. **MVC (Model-View-Controller)**
   - Separación de rutas, controladores y modelos de datos

2. **Transaction Pattern**
   - Garantiza operaciones atómicas (all or nothing)
   - Usado en creación de órdenes y pagos

3. **State Machine Pattern**
   - Validación de transiciones de estado de órdenes
   - Previene estados inválidos

4. **Role-Based Access Control (RBAC)**
   - Middleware de autorización por roles
   - Tres roles: gerente, cajero, cliente

5. **Row Locking Pattern**
   - SELECT FOR UPDATE previene condiciones de carrera
   - Aislamiento de transacciones concurrentes

6. **Repository Pattern**
   - Abstracción de acceso a datos mediante controladores
   - Pool de conexiones reutilizables

## Cómo Regenerar los Diagramas

Si necesitas modificar los diagramas, sigue estos pasos:

1. Edita el archivo `.puml` correspondiente
2. Ejecuta el comando:
   ```bash
   java -jar plantuml.jar -tpng <nombre-archivo>.puml
   ```
3. Se generará un nuevo archivo PNG con el mismo nombre

Ejemplo:
```bash
java -jar plantuml.jar -tpng sequence-diagram.puml
```

## Descripción del Sistema

**Don Pastel Backend** es un sistema de gestión para una pastelería que incluye:

- **Autenticación y autorización** con JWT y bcrypt
- **Gestión de productos** (CRUD completo)
- **Control de inventario** con alertas de stock bajo
- **Sistema de órdenes** con máquina de estados
- **Procesamiento de pagos** con prevención de duplicados
- **Reportes de ventas** con agregaciones y análisis
- **Control de acceso basado en roles** (gerente, cajero, cliente)

**Base de datos:** PostgreSQL con 6 tablas principales:
- users
- products
- inventory
- orders
- order_items
- payments

---

## Notas Adicionales

- Todos los diagramas están en formato UML estándar
- Los diagramas son auto-documentados con notas explicativas
- Se priorizó la claridad y completitud sobre la simplicidad
- Los diagramas reflejan el código real implementado en el proyecto

**Fecha de generación:** 2025-10-16
**Versión del sistema:** 1.0.0

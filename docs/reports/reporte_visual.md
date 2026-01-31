# 🌌 Shadow-Galaxy: Reporte Visual del Ecosistema

Este reporte detalla la arquitectura "Hardened" y el flujo de confianza del Scanner ERC-8004.

## 🏗️ Arquitectura del Sistema
El sistema está diseñado en una estructura de monorepo escalable, separando la lógica de indexación de la de consumo.

```mermaid
graph TD
    subgraph "Avalanche Fuji (L1)"
        IR["Identity Registry (ERC-721)"]
        RR["Reputation Registry"]
        VR["Validation Registry"]
    end

    subgraph "Backend Infrastructure"
        Worker["Indexer Worker (Node.js)"]
        Hydrator["Metadata Hydrator (Async)"]
        Sentinel["Sentinel Security Scan"]
        DB[(PostgreSQL + Prisma)]
    end

    subgraph "Access Layer"
        API["REST API (Express)"]
        Web["Explorer Dash (Next.js)"]
        Audit["Audit Dash (/tasks)"]
    end

    %% Interactions
    IR -- Events --> Worker
    RR -- Events --> Worker
    VR -- Events --> Worker
    
    Worker --> DB
    Worker --> Hydrator
    Hydrator --> DB
    Sentinel --> DB
    
    DB --> API
    API --> Web
    API --> Audit
```

## 🔄 Flujo de Confianza (Sentinel & Hydration)
Cómo un agente pasa de ser "visto" en la blockchain a ser un "Agente de Confianza".

```mermaid
sequenceDiagram
    participant BC as Blockchain (Fuji)
    participant W as Worker
    participant T as Task Queue (DB)
    participant H as Hydrator (IPFS/AR)
    participant S as Sentinel (TLS/DNS)
    participant U as UI (Frontend)

    BC->>W: Nuevo Agente Registrado
    W->>T: Crear MetadataTask (Pendiente)
    W->>T: Registrar Endpoint base
    
    loop Background Process
        H->>T: Procesar Tarea
        H->>BC: Validar Hash de Metadata
        H->>T: Marcar como COMPLETED
    end

    loop Periodic Scan (24h)
        S->>T: Buscar Endpoints "Stale"
        S->>S: Escanear HTTPS/TLS/DNS
        S->>T: Guardar Resultado de Escaneo (ScanLog)
    end

    T->>U: Mostrar Badges de Confianza (Verified ✅)
```

## 📊 Componentes del Dashboard

### 1. Agent Explorer (Home)
*   **Trust Badges**: Visualización inmediata de la salud del agente.
*   **Filter System**: Filtrado por categoría, activo y soporte x402.

### 2. Audit Dashboard (`/tasks`)
*   **Estado en Tiempo Real**: Monitor de las tareas de hidratación de fondo.
*   **Control de Errores**: Visualización de fallos de IPFS o red con lógica de reintentos.

| Componente | Nivel de Seguridad | Estado |
| :--- | :--- | :--- |
| **Blockchain Sync** | 🛡️🛡️🛡️ (Máximo) | Operativo (Persistente) |
| **Metadata Resolution** | 🛡️🛡️ (Alto) | Operativo (Asíncrono) |
| **Sentinel Guard** | 🛡️🛡️🛡️ (Máximo) | Operativo (Auto-auditoría) |

---
> [!TIP]
> **Vista Técnica**: Puedes consultar el código fuente y las ABIs en el paquete `@scanner/erc8004-sdk` para integraciones personalizadas.

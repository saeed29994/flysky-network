# Reusable Button System

This system provides consistent button styling and actions across the application.

## Usage

### 1. Import the utilities
```tsx
import { useButtonActions, buttonConfigs } from '../../utils/buttonActions';
```

### 2. Use button configurations
```tsx
const { navigateToSignup, navigateToLogin } = useButtonActions();

// Gradient button (CTA style)
<Button {...buttonConfigs.gradient} onClick={navigateToSignup}>
  Get Started
</Button>

// Default button
<Button {...buttonConfigs.default} onClick={navigateToLogin}>
  Login
</Button>

// Outline button
<Button {...buttonConfigs.outline} onClick={navigateToDashboard}>
  Dashboard
</Button>
```

### 3. Available button configurations

| Config | Variant | Size | Use Case |
|--------|---------|------|----------|
| `gradient` | gradient | gradient | Primary CTAs, signup buttons |
| `default` | default | default | Standard buttons |
| `outline` | outline | default | Secondary actions |

### 4. Available actions

| Action | Route | Description |
|--------|-------|-------------|
| `navigateToSignup` | `/signup` | Navigate to signup page |
| `navigateToLogin` | `/login` | Navigate to login page |
| `navigateToDashboard` | `/dashboard` | Navigate to dashboard |
| `navigateToMining` | `/mining` | Navigate to mining page |
| `navigateToStaking` | `/staking` | Navigate to staking page |
| `navigateToWallet` | `/wallet` | Navigate to wallet page |
| `navigateToReferral` | `/referral-program` | Navigate to referral page |
| `navigateToMembership` | `/membership` | Navigate to membership page |

### 5. Custom styling

You can override or extend the default styles:

```tsx
<Button 
  {...buttonConfigs.gradient}
  className="px-8 py-3 text-lg" // Custom padding and text size
  onClick={navigateToSignup}
>
  Join Now
</Button>
```

## Benefits

- **Consistency**: All buttons use the same styling system
- **Maintainability**: Changes to button styles are centralized
- **Reusability**: Easy to use across different components
- **Type Safety**: TypeScript support for all configurations
- **Flexibility**: Can be extended with custom styles when needed 
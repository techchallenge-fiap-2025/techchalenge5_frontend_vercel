# Guia de Cores - Plataforma EDC

## Cores Principais

### Laranja

- **Primary**: `#FF7A00` - Cor principal do app
- **Light**: `#FFA94D` - Variação clara
- **Dark**: `#CC5E00` - Variação escura

### Uso no Tailwind

```jsx
// Classes utilitárias
<div className="bg-orange-primary text-white">Laranja Principal</div>
<div className="bg-orange-light text-orange-dark">Laranja Claro</div>
<div className="bg-orange-dark text-white">Laranja Escuro</div>

// Com variações numéricas
<div className="bg-orange-500">Cor principal (500)</div>
<div className="bg-orange-400">Cor clara (400)</div>
<div className="bg-orange-700">Cor escura (700)</div>
```

## Cores de Texto e Background

### Cinza

- **Light (Background)**: `#F5F5F5`
- **Dark (Texto)**: `#2E2E2E`

### Uso no Tailwind

```jsx
<div className="bg-gray-light text-gray-dark">Background claro com texto escuro</div>
<div className="bg-gray-100 text-gray-900">Usando escala numérica</div>
```

## Cores de Status

### Success (Verde)

- `bg-success` ou `bg-success-DEFAULT`
- `bg-success-light`
- `bg-success-dark`

### Error (Vermelho)

- `bg-error` ou `bg-error-DEFAULT`
- `bg-error-light`
- `bg-error-dark`

### Warning (Amarelo)

- `bg-warning` ou `bg-warning-DEFAULT`
- `bg-warning-light`
- `bg-warning-dark`

### Info (Azul)

- `bg-info` ou `bg-info-DEFAULT`
- `bg-info-light`
- `bg-info-dark`

## Variáveis CSS

Você também pode usar as variáveis CSS diretamente:

```css
.custom-element {
  background-color: var(--color-orange-primary);
  color: var(--text-primary);
  border-color: var(--border-light);
}
```

## Exemplos de Uso

### Botão Primário

```jsx
<button className="bg-orange-primary hover:bg-orange-600 text-white px-4 py-2 rounded">
  Clique aqui
</button>
```

### Card

```jsx
<div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
  <h2 className="text-gray-dark text-xl font-semibold">Título</h2>
  <p className="text-gray-secondary mt-2">Conteúdo do card</p>
</div>
```

### Background da Página

```jsx
<div className="bg-gray-light min-h-screen">{/* Conteúdo */}</div>
```

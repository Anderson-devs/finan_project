import React, { createContext, useState } from 'react';

export const FeatureFlagContext = createContext();

export function FeatureFlagProvider({ children }) {
  const [flags, setFlags] = useState({
    entradas: true,
    saidas: true,
    relatorios: true,
    anotacoes: false,
    configuracoes: true,
    despesasPessoais: true
  });

  const toggleFlag = (flagKey, value) => {
    setFlags(prev => ({ ...prev, [flagKey]: value }));
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, toggleFlag }}>
      {children}
    </FeatureFlagContext.Provider>
  );
} 
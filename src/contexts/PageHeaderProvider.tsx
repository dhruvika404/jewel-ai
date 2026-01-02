import React, { createContext, useContext, useMemo, useState } from "react";

type HeaderSearchConfig = {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
};

type HeaderActionConfig = {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: "default" | "outline" | "secondary";
};
type DateFilterConfig = {
  dateRange?: { from: Date; to: Date };
  handleDateChange?: (range: { from: Date; to: Date }) => void;
};
type HeaderConfig = {
  title?: string;
  search?: HeaderSearchConfig;
  action?: HeaderActionConfig;
  datefilter?: DateFilterConfig;
  visible?: boolean;
  children?: React.ReactNode;
};

type HeaderContextType = {
  header: HeaderConfig;
  setHeader: (config: HeaderConfig) => void;
  clearHeader: () => void;
};

const PageHeaderContext = createContext<HeaderContextType | undefined>(
  undefined
);

export function PageHeaderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [header, setHeaderState] = useState<HeaderConfig>({ visible: true });

  const setHeader = (config: HeaderConfig) =>
    setHeaderState({ visible: true, ...(config ?? {}) });
  const clearHeader = () => setHeaderState({ visible: true });

  const value = useMemo(() => ({ header, setHeader, clearHeader }), [header]);

  return (
    <PageHeaderContext.Provider value={value}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx)
    throw new Error("usePageHeader must be used within PageHeaderProvider");
  return ctx;
}

import React from 'react';

export const lazyWithRetry = <T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) =>
  React.lazy(async () => {
    const pageHasBeenReloaded = JSON.parse(
      window.sessionStorage.getItem('chunk_retry_reloaded') || 'false'
    );
    try {
      const component = await componentImport();
      window.sessionStorage.removeItem('chunk_retry_reloaded');
      return component;
    } catch (error) {
      console.warn('Failed to fetch dynamic module chunk, attempting automatic reload:', error);
      if (!pageHasBeenReloaded) {
        window.sessionStorage.setItem('chunk_retry_reloaded', 'true');
        window.location.reload();
      }
      throw error;
    }
  });

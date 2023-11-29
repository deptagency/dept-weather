import { useEffect } from 'react';
import { LocalStorageKey } from 'constants/client';

type JsonObject = Record<string, any>;
type JsonArray = JsonObject[];
type LocalStorageValue = string | JsonObject | JsonArray;

/**
 * Returns null if window !== 'undefined'
 */
export const getLocalStorageItem = <V extends string = string>(key: LocalStorageKey) =>
  typeof window !== 'undefined' ? (localStorage.getItem(key) as V | null) ?? undefined : null;

/**
 * Sets stringified value
 */
export const setLocalStorageItem = (key: LocalStorageKey, value: LocalStorageValue) =>
  localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));

export const removeLocalStorageItem = (key: LocalStorageKey) => localStorage.removeItem(key);

export const useLocalStorage = (key: LocalStorageKey, value: LocalStorageValue) =>
  useEffect(() => setLocalStorageItem(key, value), [key, value]);

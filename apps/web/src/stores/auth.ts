import { Store } from "@tauri-apps/plugin-store";

let store: Store | null = null;

async function getStore() {
  if (!store) {
    store = await Store.load("auth.json");
  }
  return store;
}

export async function saveToken(token: string) {
  const authStore = await getStore();
  await authStore.set("auth_token", token);
  await authStore.save();
}

export async function getToken(): Promise<string | null> {
  const authStore = await getStore();
  return (await authStore.get("auth_token")) || null;
}

export async function removeToken() {
  const authStore = await getStore();
  await authStore.delete("auth_token");
  await authStore.save();
}

// Then update AuthContext to use these functions:
// Replace localStorage.setItem('auth_token', token) with:
// await saveToken(token);

// Replace localStorage.getItem('auth_token') with:
// const savedToken = await getToken();

// Replace localStorage.removeItem('auth_token') with:
// await removeToken();

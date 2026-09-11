import { router, type Href } from 'expo-router';

export function href(path: string) {
  return path as Href;
}

export function routeParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export function push(path: string) {
  router.push(href(path));
}

export function replace(path: string) {
  router.replace(href(path));
}

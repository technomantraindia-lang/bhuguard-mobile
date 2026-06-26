import { fetchApiData } from '../utils/apiHelpers';

export async function getAppBranding() {
  return fetchApiData('/app/branding');
}

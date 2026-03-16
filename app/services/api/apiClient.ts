import {format} from 'date-fns';
import {getActiveAuthHeaders} from "@/app/services/api/headersUtil";

export const apiFetch = async (path: string, headers:HeadersInit = getActiveAuthHeaders()) => fetch(`${path}`, { headers });

import {format} from 'date-fns';
import {getActiveAuthHeaders} from "@/app/services/api/headersUtil";

const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

export const apiFetch = async (path: string, headers:HeadersInit = getActiveAuthHeaders()) => fetch(`${path}`, { headers });

export { formatDate };

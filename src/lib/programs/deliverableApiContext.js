import { createContext, useContext } from 'react';
import { programDeliverablesApi } from '@/lib/programs/deliverablesApi';

/** Which owner's deliverable data (Program or Project) the shared deliverable UI works on. */
const DeliverableApiContext = createContext(programDeliverablesApi);
export const DeliverableApiProvider = DeliverableApiContext.Provider;
export const useDeliverablesApi = () => useContext(DeliverableApiContext);
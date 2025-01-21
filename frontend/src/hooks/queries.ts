import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useQueryState } from "nuqs";

const BACKEND_URL = import.meta.env.VITE_PUBLIC_SERVER_URL as string;

/**
 * A hook to get the session id for the current user.
 *
 * The session id is used to identify the user and store their code and input
 * files. If the session id does not exist, it will be created automatically.
 *
 * @returns The session id.
 */
export function useSession() {
  const [sessionId, setSessionId] = useQueryState("session_id");

  if (!sessionId) {
    useQuery({
      queryKey: ["session"],
      queryFn: () =>
        axios
          .get(`${BACKEND_URL}/session-id`)
          .then((res) => setSessionId(res.data.session_id)),
      retry: 3,
    });
  }

  return sessionId;
}

type GetLanguageOptions = Array<{ value: string; label: string }>;
/**
 * A hook to get the list of available programming languages.
 *
 * The list of languages is queried from the backend and cached for 5 minutes.
 *
 * @returns The list of available programming languages.
 */
export function useGetLanguageOptions() {
  return useQuery<GetLanguageOptions>({
    queryKey: ["languages"],
    queryFn: () =>
      axios.get(`${BACKEND_URL}/languages`).then((res) => res.data),
    retry: 3,
  });
}

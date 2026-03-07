import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import * as ContactsModule from "expo-contacts";
import { CallLogProps } from "../types";
import { groupCallsByDate } from "../utils/general-utils";
import type { CallSectionProps } from "../types";

// ---- Contacts Context ----
type ContactsContextType = {
  contacts: ContactsModule.Contact[];
  loading: boolean;
  refresh: () => void;
};

const ContactsContext = createContext<ContactsContextType>({
  contacts: [],
  loading: true,
  refresh: () => {},
});

export const useContacts = () => useContext(ContactsContext);

export const ContactsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [contacts, setContacts] = useState<ContactsModule.Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const loaded = useRef(false);

  const fetchContacts = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const { status } = await ContactsModule.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await ContactsModule.getContactsAsync({
          fields: [
            ContactsModule.Fields.PhoneNumbers,
            ContactsModule.Fields.Emails,
          ],
          sort: ContactsModule.SortTypes.FirstName,
        });
        // Filter out contacts without valid phone numbers
        const filtered = data.filter(
          (c) =>
            c.phoneNumbers &&
            c.phoneNumbers.length > 0 &&
            c.phoneNumbers.some((p) => p.number && p.number.trim() !== ""),
        );
        setContacts(filtered);
      }
    } catch (e) {
      console.log("Error loading contacts", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    fetchContacts(true);
  }, [fetchContacts]);

  const refresh = useCallback(() => {
    fetchContacts(false);
  }, [fetchContacts]);

  return (
    <ContactsContext.Provider value={{ contacts, loading, refresh }}>
      {children}
    </ContactsContext.Provider>
  );
};

// ---- Recents Context ----
type RecentsContextType = {
  sections: CallSectionProps[];
  loading: boolean;
  loadMore: () => void;
  hasMore: boolean;
  refresh: () => void;
};

const RecentsContext = createContext<RecentsContextType>({
  sections: [],
  loading: true,
  loadMore: () => {},
  hasMore: false,
  refresh: () => {},
});

export const useRecents = () => useContext(RecentsContext);

export const RecentsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [rawLogs, setRawLogs] = useState<CallLogProps[]>([]);
  const [sections, setSections] = useState<CallSectionProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const isLoadingMore = useRef(false);
  const loaded = useRef(false);

  const PAGE_SIZE = 50;

  const filterLatestPerContact = (logs: CallLogProps[]) => {
    const seen = new Set();
    return logs.filter((log) => {
      const key = log.name || log.number;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const fetchInitial = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const { CallLogsModule } = require("../modules/dialer-module");
      await CallLogsModule.requestCallLogPermission();
      // Fetch significantly more logs initially to ensure we have enough unique ones after filtering
      const result = await CallLogsModule.getCallLogs(200, 0);
      if (result && result.logs) {
        const logs = result.logs as CallLogProps[];
        const uniqueLogs = filterLatestPerContact(logs);
        setRawLogs(logs);
        setSections(groupCallsByDate(uniqueLogs));
        setHasMore(result.hasMore as boolean);
        offsetRef.current = 200;
      }
    } catch (e) {
      console.log("Error loading recents:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    fetchInitial(true);
  }, [fetchInitial]);

  // Auto-refresh when a call ends (native event)
  useEffect(() => {
    const { CallLogsModule } = require("../modules/dialer-module");
    const subscription = CallLogsModule.addListener("onCallEnded", () => {
      // Wait 2s for the system to write the call log entry
      setTimeout(() => {
        fetchInitial(false);
      }, 2000);
    });
    return () => subscription.remove();
  }, [fetchInitial]);

  const refresh = useCallback(() => {
    fetchInitial(false);
  }, [fetchInitial]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore.current || !hasMore) return;
    isLoadingMore.current = true;

    try {
      const { CallLogsModule } = require("../modules/dialer-module");
      const result = await CallLogsModule.getCallLogs(
        PAGE_SIZE,
        offsetRef.current,
      );
      if (result && result.logs) {
        const newLogs = result.logs as CallLogProps[];
        if (newLogs.length > 0) {
          setRawLogs((prev) => {
            const combined = [...prev, ...newLogs];
            const uniqueLogs = filterLatestPerContact(combined);
            setSections(groupCallsByDate(uniqueLogs));
            return combined;
          });
          setHasMore(result.hasMore as boolean);
          offsetRef.current += PAGE_SIZE;
        } else {
          setHasMore(false);
        }
      }
    } catch (e) {
      console.log("Error loading more:", e);
    } finally {
      isLoadingMore.current = false;
    }
  }, [hasMore]);

  return (
    <RecentsContext.Provider
      value={{ sections, loading, loadMore, hasMore, refresh }}
    >
      {children}
    </RecentsContext.Provider>
  );
};

// ---- Call State Context ----
type ActiveCallState = { number: string; name?: string; state: number } | null;

type CallStateContextType = {
  callState: ActiveCallState;
};

const CallStateContext = createContext<CallStateContextType>({
  callState: null,
});

export const useCallState = () => useContext(CallStateContext);

export const CallStateProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [callState, setCallState] = useState<ActiveCallState>(null);

  useEffect(() => {
    let mounted = true;

    const checkCall = async () => {
      try {
        const { CallLogsModule } = require("../modules/dialer-module");
        const activeCall = await CallLogsModule.getActiveCall?.();
        if (!mounted) return;
        if (activeCall && activeCall.state !== 7) {
          setCallState((prev) => {
            if (
              prev?.state === activeCall.state &&
              prev?.number === activeCall.number &&
              prev?.name === activeCall.name
            )
              return prev;
            return activeCall;
          });
        } else {
          setCallState((prev) => (prev === null ? prev : null));
        }
      } catch (_e) {}
    };

    checkCall();
    const interval = setInterval(checkCall, 2000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <CallStateContext.Provider value={{ callState }}>
      {children}
    </CallStateContext.Provider>
  );
};

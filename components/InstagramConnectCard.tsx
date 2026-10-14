import { Ionicons } from '@/components/FlatIcon';
import { Illo } from '@/constants/Illustration';
import { useInstagramConnection } from '@/hooks/useInstagramConnection';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

type Props = {
  /** Called with the connected @handle (when known), so the caller can keep it. */
  onConnected?: (username?: string) => void;
};

/**
 * Connect Instagram and import posts, against the backend's real OAuth flow.
 * The same card is used in creative onboarding and after sign-up.
 */
export default function InstagramConnectCard({ onConnected }: Props) {
  const isDark = useColorScheme() === 'dark';
  const { phase, username, importedCount, error, connect, importPosts, disconnect, refresh } =
    useInstagramConnection();

  const theme = {
    card: isDark ? '#14181D' : '#F5F7F8',
    border: isDark ? '#2F3A46' : '#DDE3E8',
    text: isDark ? '#FFFFFF' : '#0F1419',
    sub: isDark ? '#B8C0C8' : '#4A545E',
  };

  useEffect(() => {
    if (phase === 'connected' || phase === 'imported') onConnected?.(username);
  }, [phase, username]);

  const busy = phase === 'checking' || phase === 'connecting' || phase === 'importing';

  const Primary = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.primary} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.primaryText}>{label}</Text>
    </TouchableOpacity>
  );

  let body: React.ReactNode;
  if (busy) {
    const label =
      phase === 'connecting' ? 'Waiting for Instagram to confirm…'
      : phase === 'importing' ? 'Bringing in your posts…'
      : 'Checking your connection…';
    body = (
      <View style={styles.row}>
        <ActivityIndicator color={Illo.teal} />
        <Text style={[styles.status, { color: theme.text }]}>{label}</Text>
      </View>
    );
  } else if (phase === 'imported') {
    body = (
      <>
        <View style={styles.row}>
          <Ionicons name="checkmark-circle" size={26} color={Illo.teal} />
          <Text style={[styles.status, { color: theme.text }]}>
            {typeof importedCount === 'number' && importedCount > 0
              ? `Imported ${importedCount} ${importedCount === 1 ? 'post' : 'posts'}`
              : 'Your posts are imported'}
          </Text>
        </View>
        <Text style={[styles.help, { color: theme.sub }]}>
          They are added to your listings. Review them and remove any you don't want to share.
        </Text>
      </>
    );
  } else if (phase === 'connected') {
    body = (
      <>
        <View style={styles.row}>
          <Ionicons name="checkmark-circle" size={26} color={Illo.teal} />
          <Text style={[styles.status, { color: theme.text }]}>
            Connected{username ? ` as @${username}` : ''}
          </Text>
        </View>
        <Primary label="Import my posts" onPress={() => void importPosts()} />
        <TouchableOpacity onPress={() => void disconnect()} style={styles.link}>
          <Text style={[styles.linkText, { color: theme.sub }]}>Disconnect</Text>
        </TouchableOpacity>
      </>
    );
  } else {
    body = (
      <>
        {phase === 'error' && error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#B3261E" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <Primary label={phase === 'error' ? 'Try again' : 'Connect Instagram'} onPress={() => void connect()} />
        {phase === 'error' ? (
          <TouchableOpacity onPress={() => void refresh()} style={styles.link}>
            <Text style={[styles.linkText, { color: theme.sub }]}>I finished on Instagram, check again</Text>
          </TouchableOpacity>
        ) : null}
      </>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Ionicons name="logo-instagram" size={26} color="#0F1419" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>Bring your Instagram in</Text>
          <Text style={[styles.help, { color: theme.sub }]}>
            Connect your business or creator account and we'll turn your posts into listings you can edit.
          </Text>
        </View>
      </View>
      <View style={styles.body}>{body}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Illo.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  help: {
    fontSize: 14,
    lineHeight: 20,
  },
  body: {
    marginTop: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  status: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  primary: {
    backgroundColor: Illo.teal,
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: Illo.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  link: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FDECEA',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    flex: 1,
    color: '#7A1A14',
    fontSize: 14,
    lineHeight: 20,
  },
});

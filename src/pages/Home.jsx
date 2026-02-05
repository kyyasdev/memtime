import { useEffect, useState } from 'react';
import { Card, Typography, Tabs, Button, Space } from 'antd';
import { MailOutlined, GlobalOutlined, LinkedinOutlined, GithubOutlined } from '@ant-design/icons';
import { ClientProjectTaskTree } from '../components/ClientProjectTaskTree';
import { TimeEntriesList } from '../components/TimeEntries';
import { TimeEntryModal } from '../components/TimeEntryModal';
import { api } from '../api/api';

const PAGE_SIZE = 10;

export function Home() {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [entries, setEntries] = useState(null);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesError, setEntriesError] = useState(null);
  const [entriesOffset, setEntriesOffset] = useState(0);
  const [entriesHasNext, setEntriesHasNext] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setEntriesLoading(true);
    setEntriesError(null);
    (async () => {
      try {
        const res = await api.get('/time-entries', {
          params: { limit: PAGE_SIZE, offset: entriesOffset, sortBy: 'start', order: 'desc' },
        });
        const list = res.data;
        if (!cancelled) {
          setEntries(list);
          setEntriesHasNext(list.length === PAGE_SIZE);
        }
      } catch (e) {
        if (!cancelled) {
          setEntriesError(e instanceof Error ? e.message : 'Failed to load time entries');
        }
      } finally {
        if (!cancelled) {
          setEntriesLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entriesOffset]);

  const handlePageChange = (direction) => {
    if (direction === 'prev' && entriesOffset > 0) {
      setEntriesOffset((o) => Math.max(0, o - PAGE_SIZE));
    }
    if (direction === 'next' && entriesHasNext && !entriesLoading) {
      setEntriesOffset((o) => o + PAGE_SIZE);
    }
  };

  const refreshEntries = async () => {
    try {
      setEntriesLoading(true);
      setEntriesError(null);
      const res = await api.get('/time-entries', {
        params: { limit: PAGE_SIZE, offset: entriesOffset, sortBy: 'start', order: 'desc' },
      });
      const list = res.data;
      setEntries(list);
      setEntriesHasNext(list.length === PAGE_SIZE);
    } catch (e) {
      setEntriesError(e instanceof Error ? e.message : 'Failed to load time entries');
    } finally {
      setEntriesLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Typography.Title level={4} style={{ margin: 0, fontWeight: 600 }}>
          Memtime Interview Task
        </Typography.Title>
        {/* My Contact Details 😀 */}
        <Space>
          <span style={{ fontWeight: 500 }}>Kyyas Ilmyradov</span>
          <Button
            type="link"
            size="small"
            icon={<GithubOutlined />}
            href="https://github.com/kyyasdev"
            target="_blank"
          />
          <Button
            type="link"
            size="small"
            icon={<LinkedinOutlined />}
            href="https://www.linkedin.com/in/kyyasdev/"
            target="_blank"
          />
          <Button
            type="link"
            size="small"
            icon={<GlobalOutlined />}
            href="https://kyyas.dev"
            target="_blank"
          />
          <Button
            type="link"
            size="small"
            icon={<MailOutlined />}
            href="mailto:kyyasdev@gmail.com"
          />
        </Space>
      </div>

      {/* Top Tabs: Clients & Time Entries */}
      <Tabs
        defaultActiveKey="hierarchy"
        items={[
          {
            key: 'hierarchy',
            label: 'Clients / Projects / Tasks',
            children: (
              <Card variant="outlined" size="small" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <ClientProjectTaskTree />
              </Card>
            ),
          },
          {
            key: 'timeEntries',
            label: 'Time Entries',
            children: (
              <Card variant="outlined" size="small" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <TimeEntriesList
                  entries={entries}
                  loading={entriesLoading}
                  error={entriesError}
                  offset={entriesOffset}
                  hasNextPage={entriesHasNext}
                  selectedEntryId={selectedEntry?.id ?? null}
                  onSelectEntry={(entry) => {
                    setSelectedEntry(entry);
                    setEntryModalOpen(true);
                  }}
                  onPageChange={handlePageChange}
                  onCreateNew={() => {
                    setSelectedEntry(null);
                    setEntryModalOpen(true);
                  }}
                />
                <TimeEntryModal
                  open={entryModalOpen}
                  entry={selectedEntry}
                  onClose={() => {
                    setEntryModalOpen(false);
                    setSelectedEntry(null);
                  }}
                  onSaved={() => {
                    setEntryModalOpen(false);
                    setSelectedEntry(null);
                    refreshEntries();
                  }}
                  onDeleted={() => {
                    setEntryModalOpen(false);
                    setSelectedEntry(null);
                    refreshEntries();
                  }}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}


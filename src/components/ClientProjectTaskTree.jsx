import { useEffect, useState, useCallback } from 'react';
import { Table, Spin, Alert, Tag, Typography, Button, Space } from 'antd';
import { api } from '../api/api';

const PAGE_SIZE = 10;

function statusColor(status) {
  if (status === 'completed') return 'green';
  if (status === 'in-progress') return 'blue';
  if (status === 'pending') return 'orange';
  return 'default';
}

export function ClientProjectTaskTree() {
  const [clients, setClients] = useState(null);
  const [clientsError, setClientsError] = useState(null);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientOffset, setClientOffset] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [projectsByClientId, setProjectsByClientId] = useState({});
  const [tasksByProjectId, setTasksByProjectId] = useState({});
  const [expandedProjectKeysByClient, setExpandedProjectKeysByClient] = useState({});

  useEffect(() => {
    let cancelled = false;
    setClientsLoading(true);
    (async () => {
      try {
        const res = await api.get('/clients', {
          params: { limit: PAGE_SIZE, offset: clientOffset, sortBy: 'name', order: 'asc' },
        });
        const list = res.data;
        if (!cancelled) {
          setClients(list);
          setHasNextPage(list.length === PAGE_SIZE);
        }
      } catch (e) {
        if (!cancelled) setClientsError(e instanceof Error ? e.message : 'Failed to load clients');
      } finally {
        if (!cancelled) setClientsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clientOffset]);

  const loadProjects = useCallback(async (clientId) => {
    setProjectsByClientId((prev) => {
      if (prev[clientId]) return prev;
      return { ...prev, [clientId]: { status: 'loading' } };
    });
    try {
      const res = await api.get(`/clients/${clientId}/projects`, {
        params: { limit: PAGE_SIZE, offset: 0, sortBy: 'name', order: 'asc' },
      });
      const data = res.data;
      setProjectsByClientId((prev) => ({ ...prev, [clientId]: { status: 'loaded', data } }));
    } catch (e) {
      setProjectsByClientId((prev) => ({
        ...prev,
        [clientId]: { status: 'error', error: e instanceof Error ? e.message : 'Failed to load projects' },
      }));
    }
  }, []);

  const loadTasks = useCallback(async (projectId) => {
    setTasksByProjectId((prev) => {
      if (prev[projectId]) return prev;
      return { ...prev, [projectId]: { status: 'loading' } };
    });
    try {
      const res = await api.get(`/projects/${projectId}/tasks`, {
        params: { limit: PAGE_SIZE, offset: 0, sortBy: 'createdAt', order: 'asc' },
      });
      const data = res.data;
      setTasksByProjectId((prev) => ({ ...prev, [projectId]: { status: 'loaded', data } }));
    } catch (e) {
      setTasksByProjectId((prev) => ({
        ...prev,
        [projectId]: { status: 'error', error: e instanceof Error ? e.message : 'Failed to load tasks' },
      }));
    }
  }, []);

  const onClientExpand = useCallback(
    (expanded, record) => {
      if (expanded && !projectsByClientId[record.id]) loadProjects(record.id);
    },
    [projectsByClientId, loadProjects]
  );

  const clientColumns = [
    {
      title: 'Client',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <Typography.Text strong>{name}</Typography.Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status) => <Tag color={statusColor(status)}>{status}</Tag>,
    },
  ];

  const nestedTableColumns = [
    {
      title: 'Projects',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <Typography.Text>{name}</Typography.Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status) => <Tag color={statusColor(status)}>{status}</Tag>,
    },
  ];

  const renderProjectsExpand = (client) => {
    const state = projectsByClientId[client.id];
    if (!state) return <div style={{ padding: 16 }}><Spin size="small" /></div>;
    if (state.status === 'loading') return <div style={{ padding: 16 }}><Spin size="small" /></div>;
    if (state.status === 'error') return <Alert type="error" message={state.error} showIcon style={{ margin: 16 }} />;
    const projects = state.data ?? [];
    const expandedKeys = expandedProjectKeysByClient[client.id] ?? [];

    return (
      <Table
        size="small"
        showHeader={false}
        columns={nestedTableColumns}
        dataSource={projects.map((p) => ({ ...p, key: p.id }))}
        pagination={false}
        expandable={{
          expandedRowKeys: expandedKeys,
          expandedRowRender: (project) => {
            const taskState = tasksByProjectId[project.id];
            if (!taskState) return <Spin size="small" />;
            if (taskState.status === 'loading') return <Spin size="small" />;
            if (taskState.status === 'error') return <Alert type="error" message={taskState.error} showIcon />;
            const tasks = taskState.data ?? [];
            return (
              <Table
                showHeader={false}
                columns={nestedTableColumns}
                dataSource={tasks.map((t) => ({ ...t, key: t.id }))}
                pagination={false}
              />
            );
          },
          rowExpandable: () => true,
          onExpand: (expanded, project) => {
            if (expanded && !tasksByProjectId[project.id]) loadTasks(project.id);
            setExpandedProjectKeysByClient((prev) => {
              const current = prev[client.id] ?? [];
              if (expanded) return { ...prev, [client.id]: [...current, project.id] };
              return { ...prev, [client.id]: current.filter((k) => k !== project.id) };
            });
          },
        }}
      />
    );
  };

  // Initial lood: no clients yet → full-page spinner
  if (clientsLoading && !clients) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (clientsError) {
    return <Alert type="error" message={clientsError} showIcon style={{ marginTop: 16 }} />;
  }

  const clientData = clients.map((c) => ({ ...c, key: c.id }));

  return (
    <>
      <div style={{ position: 'relative' }}>
        {!clients?.length ? <Typography.Text type="secondary" style={{ display: 'block', padding: 24 }}>No clients found.</Typography.Text>
          :
          <Table
            columns={clientColumns}
            dataSource={clientData}
            expandable={{
              expandedRowRender: renderProjectsExpand,
              rowExpandable: () => true,
              onExpand: onClientExpand,
              expandedRowKeys,
              onExpandedRowsChange: (keys) => setExpandedRowKeys(keys ? [...keys] : []),
            }}
            pagination={false}
          />}
        {clientsLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backdropFilter: 'blur(3px)',
              backgroundColor: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
            }}
          >
            <Spin size="large" />
          </div>
        )}
      </div>
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Space>
          <Button
            disabled={clientOffset === 0 || clientsLoading}
            onClick={() => setClientOffset((o) => Math.max(0, o - PAGE_SIZE))}
          >
            Previous
          </Button>
          <Button
            disabled={!hasNextPage || clientsLoading}
            onClick={() => setClientOffset((o) => o + PAGE_SIZE)}
          >
            Next
          </Button>
        </Space>
      </div>
    </>
  );
}

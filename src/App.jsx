import { ConfigProvider, App as AntdApp } from 'antd';
import { Home } from './pages/Home';

const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 8,
    colorBorderSecondary: '#e8e8e8',
  },
  components: {
    Table: {
      headerBg: '#fafafa',
      headerColor: 'rgba(0,0,0,0.88)',
    },
  },
};

function App() {
  return (
    <ConfigProvider theme={theme}>
      <AntdApp>
        <Home />
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;

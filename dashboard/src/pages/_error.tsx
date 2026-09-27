// Custom error page for Pages Router compatibility
// This prevents the Next.js default _error page from conflicting with the App Router layout
function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#020617', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f1f5f9' }}>
          {statusCode ? `${statusCode} Error` : 'Client Error'}
        </h1>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
          {statusCode === 404 ? 'Page not found' : 'An unexpected error occurred'}
        </p>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: { res?: { statusCode?: number }, err?: { statusCode?: number } }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;

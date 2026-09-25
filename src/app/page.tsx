export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>Verity Sample App</h1>
      <p>
        This is a deliberately incomplete sample project used as a test fixture
        for the <strong>Verity</strong> requirement-verification prototype.
      </p>
      <p>
        See <code>docs/admin-csv-export.md</code> for the feature specification,
        and <code>src/app/api/admin/export/route.ts</code> for the implementation.
      </p>
    </main>
  );
}

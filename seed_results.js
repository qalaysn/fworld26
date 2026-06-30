// Seeds official group-stage results into /api/results
// Usage: ADMIN_TOKEN=xxx node seed_results.js [base_url]
// Example: ADMIN_TOKEN=secret123 node seed_results.js http://localhost:3000

const BASE = process.argv[2] || 'http://localhost:3000';
const TOKEN = process.env.ADMIN_TOKEN || process.argv[3] || '';

if (!TOKEN) {
  console.error('Error: set ADMIN_TOKEN env var or pass as 3rd argument');
  process.exit(1);
}

// ─── GROUP DATA (mirror of wc2026_predict.html GDATA) ────────────────────────
// teams[0..3] per group; GM match combos: [0v1, 2v3, 0v2, 1v3, 0v3, 1v2]
// Scores: h = goals by team[home_idx], a = goals by team[away_idx]
// Source: ESPN / FIFA official / Wikipedia — June 2026 group stage final results

const groups = {
  // Group A: Mexico(0) S.Korea(1) S.Africa(2) Czechia(3)
  A: {
    A0: {h:1,a:0},  // Mexico 1-0 S.Korea
    A1: {h:1,a:1},  // S.Africa 1-1 Czechia
    A2: {h:2,a:0},  // Mexico 2-0 S.Africa
    A3: {h:2,a:1},  // S.Korea 2-1 Czechia
    A4: {h:3,a:0},  // Mexico 3-0 Czechia
    A5: {h:0,a:1},  // S.Korea 0-1 S.Africa
  },
  // Final: Mexico 9pts 1st | S.Africa 4pts 2nd | S.Korea 3pts 3rd | Czechia 1pt 4th

  // Group B: Canada(0) Switzerland(1) Qatar(2) Bosnia(3)
  B: {
    B0: {h:1,a:2},  // Canada 1-2 Switzerland
    B1: {h:1,a:3},  // Qatar 1-3 Bosnia
    B2: {h:6,a:0},  // Canada 6-0 Qatar
    B3: {h:4,a:1},  // Switzerland 4-1 Bosnia
    B4: {h:1,a:1},  // Canada 1-1 Bosnia
    B5: {h:1,a:1},  // Switzerland 1-1 Qatar
  },
  // Final: Switzerland 7pts 1st | Canada 4pts 2nd | Bosnia 4pts 3rd | Qatar 1pt 4th

  // Group C: Brazil(0) Morocco(1) Haiti(2) Scotland(3)
  C: {
    C0: {h:1,a:1},  // Brazil 1-1 Morocco
    C1: {h:0,a:1},  // Haiti 0-1 Scotland
    C2: {h:3,a:0},  // Brazil 3-0 Haiti
    C3: {h:1,a:0},  // Morocco 1-0 Scotland
    C4: {h:3,a:0},  // Brazil 3-0 Scotland
    C5: {h:4,a:2},  // Morocco 4-2 Haiti
  },
  // Final: Brazil 7pts 1st | Morocco 7pts 2nd | Scotland 3pts 3rd | Haiti 0pts 4th

  // Group D: USA(0) Paraguay(1) Australia(2) Türkiye(3)
  D: {
    D0: {h:4,a:1},  // USA 4-1 Paraguay
    D1: {h:2,a:0},  // Australia 2-0 Türkiye
    D2: {h:2,a:0},  // USA 2-0 Australia
    D3: {h:1,a:0},  // Paraguay 1-0 Türkiye
    D4: {h:2,a:3},  // USA 2-3 Türkiye
    D5: {h:0,a:0},  // Paraguay 0-0 Australia
  },
  // Final: USA 6pts 1st | Australia 4pts 2nd | Paraguay 4pts 3rd | Türkiye 3pts 4th

  // Group E: Germany(0) Curaçao(1) Ecuador(2) Iv.Coast(3)
  E: {
    E0: {h:7,a:1},  // Germany 7-1 Curaçao
    E1: {h:0,a:1},  // Ecuador 0-1 Iv.Coast
    E2: {h:1,a:2},  // Germany 1-2 Ecuador
    E3: {h:0,a:2},  // Curaçao 0-2 Iv.Coast
    E4: {h:2,a:1},  // Germany 2-1 Iv.Coast
    E5: {h:0,a:0},  // Curaçao 0-0 Ecuador
  },
  // Final: Germany 6pts 1st | Iv.Coast 6pts 2nd | Ecuador 4pts 3rd | Curaçao 1pt 4th

  // Group F: Netherlands(0) Sweden(1) Tunisia(2) Japan(3)
  F: {
    F0: {h:5,a:1},  // Netherlands 5-1 Sweden
    F1: {h:0,a:4},  // Tunisia 0-4 Japan
    F2: {h:3,a:1},  // Netherlands 3-1 Tunisia
    F3: {h:1,a:1},  // Sweden 1-1 Japan
    F4: {h:2,a:2},  // Netherlands 2-2 Japan
    F5: {h:5,a:1},  // Sweden 5-1 Tunisia
  },
  // Final: Netherlands 7pts 1st | Japan 5pts 2nd | Sweden 4pts 3rd | Tunisia 0pts 4th

  // Group G: Belgium(0) Egypt(1) Iran(2) New Zealand(3)
  G: {
    G0: {h:1,a:1},  // Belgium 1-1 Egypt
    G1: {h:2,a:2},  // Iran 2-2 New Zealand
    G2: {h:0,a:0},  // Belgium 0-0 Iran
    G3: {h:3,a:1},  // Egypt 3-1 New Zealand  (Salah scored — Al Jazeera confirmed)
    G4: {h:5,a:1},  // Belgium 5-1 New Zealand
    G5: {h:1,a:1},  // Egypt 1-1 Iran
  },
  // Final: Belgium 5pts 1st | Egypt 5pts 2nd | Iran 3pts 3rd | New Zealand 1pt 4th

  // Group H: Spain(0) C.Verde(1) S.Arabia(2) Uruguay(3)
  H: {
    H0: {h:0,a:0},  // Spain 0-0 Cape Verde
    H1: {h:1,a:1},  // S.Arabia 1-1 Uruguay
    H2: {h:4,a:0},  // Spain 4-0 S.Arabia
    H3: {h:2,a:2},  // Cape Verde 2-2 Uruguay
    H4: {h:1,a:0},  // Spain 1-0 Uruguay
    H5: {h:0,a:0},  // Cape Verde 0-0 S.Arabia
  },
  // Final: Spain 7pts 1st | Cape Verde 3pts 2nd | Uruguay 2pts 3rd | S.Arabia 2pts 4th

  // Group I: France(0) Senegal(1) Iraq(2) Norway(3)
  I: {
    I0: {h:3,a:1},  // France 3-1 Senegal
    I1: {h:1,a:4},  // Iraq 1-4 Norway
    I2: {h:3,a:0},  // France 3-0 Iraq
    I3: {h:2,a:3},  // Senegal 2-3 Norway
    I4: {h:4,a:1},  // France 4-1 Norway
    I5: {h:5,a:0},  // Senegal 5-0 Iraq
  },
  // Final: France 9pts 1st | Norway 6pts 2nd | Senegal 3pts 3rd | Iraq 0pts 4th

  // Group J: Argentina(0) Algeria(1) Austria(2) Jordan(3)
  J: {
    J0: {h:3,a:0},  // Argentina 3-0 Algeria
    J1: {h:3,a:1},  // Austria 3-1 Jordan
    J2: {h:2,a:0},  // Argentina 2-0 Austria
    J3: {h:2,a:1},  // Algeria 2-1 Jordan
    J4: {h:3,a:0},  // Argentina 3-0 Jordan
    J5: {h:3,a:3},  // Algeria 3-3 Austria
  },
  // Final: Argentina 9pts 1st | Austria 4pts 2nd | Algeria 4pts 3rd | Jordan 0pts 4th

  // Group K: Portugal(0) DR Congo(1) Uzbekistan(2) Colombia(3)
  K: {
    K0: {h:1,a:1},  // Portugal 1-1 DR Congo
    K1: {h:0,a:1},  // Uzbekistan 0-1 Colombia
    K2: {h:5,a:0},  // Portugal 5-0 Uzbekistan
    K3: {h:0,a:1},  // DR Congo 0-1 Colombia
    K4: {h:0,a:0},  // Portugal 0-0 Colombia
    K5: {h:3,a:0},  // DR Congo 3-0 Uzbekistan
  },
  // Final: Colombia 7pts 1st | Portugal 5pts 2nd | DR Congo 4pts 3rd | Uzbekistan 0pts 4th

  // Group L: England(0) Croatia(1) Ghana(2) Panama(3)
  L: {
    L0: {h:4,a:2},  // England 4-2 Croatia
    L1: {h:1,a:0},  // Ghana 1-0 Panama
    L2: {h:0,a:0},  // England 0-0 Ghana
    L3: {h:1,a:0},  // Croatia 1-0 Panama
    L4: {h:2,a:0},  // England 2-0 Panama
    L5: {h:2,a:1},  // Croatia 2-1 Ghana
  },
  // Final: England 7pts 1st | Croatia 6pts 2nd | Ghana 4pts 3rd | Panama 0pts 4th
};

// ─── BRACKET ─────────────────────────────────────────────────────────────────
// NOTE: The app's R32 bracket structure (R32S) was configured before the
// tournament and does NOT match the actual FIFA 2026 bracket. The only
// directly matching slot is App Match 4 (2D vs 2G = Australia vs Egypt)
// which has not been played yet as of June 30.
//
// Real R32 results so far (June 28-29, 2026):
//   Canada 1-0 South Africa
//   Brazil 2-1 Japan
//   Paraguay 1-1 Germany (Paraguay wins 4-3 on penalties)
//   Morocco 1-1 Netherlands (Morocco wins 3-2 on penalties)
//
// These cannot be mapped to app bracket slots since the bracket structures differ.
// Leave bracket empty — enter via admin UI as matches are played.
const bracket = {};

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nSeeding official results to ${BASE}\n`);

  const r = await fetch(`${BASE}/api/results`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': TOKEN },
    body: JSON.stringify({ groups, bracket })
  });

  if (!r.ok) {
    const err = await r.text();
    console.error('Error:', r.status, err);
    process.exit(1);
  }

  const d = await r.json();
  if (!d.ok) { console.error('Failed:', d); process.exit(1); }

  const totalMatches = Object.values(groups).reduce((s,g) => s + Object.keys(g).length, 0);
  console.log(`✓ Saved ${totalMatches} group match results (72 expected)`);
  console.log(`✓ Bracket: empty (R32 bracket structure differs from app — enter via admin UI)`);
  console.log('\nGroup standings summary:');
  console.log('  A: Mexico | S.Africa | S.Korea | Czechia');
  console.log('  B: Switzerland | Canada | Bosnia | Qatar');
  console.log('  C: Brazil | Morocco | Scotland | Haiti');
  console.log('  D: USA | Australia | Paraguay | Türkiye');
  console.log('  E: Germany | Iv.Coast | Ecuador | Curaçao');
  console.log('  F: Netherlands | Japan | Sweden | Tunisia');
  console.log('  G: Belgium | Egypt | Iran | New Zealand');
  console.log('  H: Spain | Cape Verde | Uruguay | S.Arabia');
  console.log('  I: France | Norway | Senegal | Iraq');
  console.log('  J: Argentina | Austria | Algeria | Jordan');
  console.log('  K: Colombia | Portugal | DR Congo | Uzbekistan');
  console.log('  L: England | Croatia | Ghana | Panama');
  console.log(`\n🏆  Done! View at ${BASE}/wc2026_predict.html\n`);
}

main().catch(e => { console.error(e); process.exit(1); });

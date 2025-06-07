const ranks = [
  { name: 'なし', threshold: 0, bonus: 0 },
  { name: 'ブロンズ', threshold: 100000, bonus: 4000 },
  { name: 'シルバー', threshold: 1000000, bonus: 10000 },
  { name: 'ゴールド', threshold: 5000000, bonus: 50000 },
  { name: 'プラチナ1', threshold: 10000000, bonus: 100000 },
  { name: 'プラチナ2', threshold: 20000000, bonus: 200000 },
  { name: 'プラチナ3', threshold: 30000000, bonus: 300000 },
  { name: 'プラチナ4', threshold: 50000000, bonus: 500000 },
  { name: 'プラチナ5', threshold: 70000000, bonus: 700000 },
  { name: 'ダイヤモンド1', threshold: 100000000, bonus: 1000000 },
  { name: 'ダイヤモンド2', threshold: 200000000, bonus: 2000000 },
  { name: 'ダイヤモンド3', threshold: 300000000, bonus: 3000000 },
  { name: 'ダイヤモンド4', threshold: 400000000, bonus: 4000000 },
  { name: 'ダイヤモンド5', threshold: 500000000, bonus: 5000000 },
];

function getRankByTotalBet(totalBet) {
  let rank = ranks[0];
  for (const r of ranks) {
    if (totalBet >= r.threshold) rank = r;
    else break;
  }
  return rank;
}

module.exports = { ranks, getRankByTotalBet };

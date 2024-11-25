import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the blockchain state
let userReputations: Map<string, any> = new Map();

// Mock contract functions
const updateReputation = (user: string, correct: boolean, stake: number) => {
  const currentRep = userReputations.get(user) || {
    predictionCount: 0,
    correctPredictions: 0,
    totalStake: 0,
    reputationScore: 0
  };
  
  const newPredictionCount = currentRep.predictionCount + 1;
  const newCorrectPredictions = correct ? currentRep.correctPredictions + 1 : currentRep.correctPredictions;
  const newTotalStake = currentRep.totalStake + stake;
  
  const accuracy = newPredictionCount > 0 ? (newCorrectPredictions * 100) / newPredictionCount : 0;
  const stakeFactor = Math.floor(newTotalStake / 10000000); // Adjust stake factor calculation
  const newReputationScore = Math.floor(accuracy) + stakeFactor;
  
  userReputations.set(user, {
    predictionCount: newPredictionCount,
    correctPredictions: newCorrectPredictions,
    totalStake: newTotalStake,
    reputationScore: newReputationScore
  });
  
  return true;
};

const getReputation = (user: string) => {
  const reputation = userReputations.get(user);
  if (!reputation) {
    throw new Error('ERR-NOT-FOUND');
  }
  return reputation;
};

describe('Reputation System Contract', () => {
  beforeEach(() => {
    userReputations.clear();
  });
  
  it('should update reputation correctly', () => {
    const result = updateReputation('user1', true, 100000000); // 100 STX
    expect(result).toBe(true);
    
    const reputation = getReputation('user1');
    expect(reputation.predictionCount).toBe(1);
    expect(reputation.correctPredictions).toBe(1);
    expect(reputation.totalStake).toBe(100000000);
    expect(reputation.reputationScore).toBe(110); // 100 (accuracy) + 10 (stake factor)
  });
  
  it('should retrieve correct reputation', () => {
    updateReputation('user1', true, 100000000); // 100 STX
    
    const reputation = getReputation('user1');
    expect(reputation.predictionCount).toBe(1);
    expect(reputation.correctPredictions).toBe(1);
    expect(reputation.totalStake).toBe(100000000);
    expect(reputation.reputationScore).toBe(110); // 100 (accuracy) + 10 (stake factor)
  });
  
  it('should handle multiple reputation updates', () => {
    updateReputation('user1', true, 100000000); // 100 STX
    updateReputation('user1', false, 50000000); // 50 STX
    
    const reputation = getReputation('user1');
    expect(reputation.predictionCount).toBe(2);
    expect(reputation.correctPredictions).toBe(1);
    expect(reputation.totalStake).toBe(150000000);
    expect(reputation.reputationScore).toBe(65); // 50 (accuracy) + 15 (stake factor)
  });
  
  it('should return error for non-existent user', () => {
    expect(() => getReputation('nonexistentUser')).toThrow('ERR-NOT-FOUND');
  });
});


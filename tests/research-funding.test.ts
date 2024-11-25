import { describe, it, expect, beforeEach } from 'vitest';

// Mock blockchain state
let researchProjects: Map<number, any> = new Map();
let projectFunders: Map<string, number> = new Map();
let nextProjectId = 0;

// Mock contract functions
const createProject = (creator: string, title: string, description: string, fundingGoal: number, duration: number) => {
  const projectId = nextProjectId++;
  researchProjects.set(projectId, {
    creator,
    title,
    description,
    fundingGoal,
    currentFunding: 0,
    expirationDate: 100 + duration // Assuming current block height is 100
  });
  return projectId;
};

const fundProject = (projectId: number, funder: string, amount: number) => {
  const project = researchProjects.get(projectId);
  if (!project) {
    throw new Error('ERR-NOT-FOUND');
  }
  if (100 >= project.expirationDate) { // Assuming current block height is 100
    throw new Error('ERR-EXPIRED');
  }
  project.currentFunding += amount;
  researchProjects.set(projectId, project);
  
  const funderKey = `${projectId}-${funder}`;
  const currentFunding = projectFunders.get(funderKey) || 0;
  projectFunders.set(funderKey, currentFunding + amount);
  
  return true;
};

const withdrawFunds = (projectId: number, caller: string) => {
  const project = researchProjects.get(projectId);
  if (!project) {
    throw new Error('ERR-NOT-FOUND');
  }
  if (caller !== project.creator) {
    throw new Error('ERR-UNAUTHORIZED');
  }
  if (project.currentFunding < project.fundingGoal) {
    throw new Error('ERR-UNAUTHORIZED');
  }
  const withdrawnAmount = project.currentFunding;
  project.currentFunding = 0;
  researchProjects.set(projectId, project);
  return withdrawnAmount;
};

const getProject = (projectId: number) => {
  const project = researchProjects.get(projectId);
  if (!project) {
    throw new Error('ERR-NOT-FOUND');
  }
  return project;
};

const getFunderContribution = (projectId: number, funder: string) => {
  const funderKey = `${projectId}-${funder}`;
  return projectFunders.get(funderKey) || 0;
};

describe('Research Funding Contract', () => {
  beforeEach(() => {
    researchProjects.clear();
    projectFunders.clear();
    nextProjectId = 0;
  });
  
  it('should create a project successfully', () => {
    const projectId = createProject('creator1', 'Test Project', 'A test project', 1000000000, 100);
    expect(projectId).toBe(0);
    const project = getProject(projectId);
    expect(project.title).toBe('Test Project');
    expect(project.fundingGoal).toBe(1000000000);
    expect(project.currentFunding).toBe(0);
    expect(project.expirationDate).toBe(200);
  });
  
  it('should allow funding a project', () => {
    const projectId = createProject('creator1', 'Test Project', 'A test project', 1000000000, 100);
    const result = fundProject(projectId, 'funder1', 500000000);
    expect(result).toBe(true);
    const project = getProject(projectId);
    expect(project.currentFunding).toBe(500000000);
    const funderContribution = getFunderContribution(projectId, 'funder1');
    expect(funderContribution).toBe(500000000);
  });
  
  it('should not allow funding an expired project', () => {
    const projectId = createProject('creator1', 'Test Project', 'A test project', 1000000000, -1);
    expect(() => fundProject(projectId, 'funder1', 500000000)).toThrow('ERR-EXPIRED');
  });
  
  it('should allow withdrawing funds when goal is reached', () => {
    const projectId = createProject('creator1', 'Test Project', 'A test project', 1000000000, 100);
    fundProject(projectId, 'funder1', 600000000);
    fundProject(projectId, 'funder2', 400000000);
    const withdrawnAmount = withdrawFunds(projectId, 'creator1');
    expect(withdrawnAmount).toBe(1000000000);
    const project = getProject(projectId);
    expect(project.currentFunding).toBe(0);
  });
  
  it('should not allow withdrawing funds when goal is not reached', () => {
    const projectId = createProject('creator1', 'Test Project', 'A test project', 1000000000, 100);
    fundProject(projectId, 'funder1', 500000000);
    expect(() => withdrawFunds(projectId, 'creator1')).toThrow('ERR-UNAUTHORIZED');
  });
  
  it('should not allow non-creator to withdraw funds', () => {
    const projectId = createProject('creator1', 'Test Project', 'A test project', 1000000000, 100);
    fundProject(projectId, 'funder1', 1000000000);
    expect(() => withdrawFunds(projectId, 'attacker')).toThrow('ERR-UNAUTHORIZED');
  });
  
  it('should track multiple funders correctly', () => {
    const projectId = createProject('creator1', 'Test Project', 'A test project', 1000000000, 100);
    fundProject(projectId, 'funder1', 300000000);
    fundProject(projectId, 'funder2', 400000000);
    fundProject(projectId, 'funder1', 300000000);
    expect(getFunderContribution(projectId, 'funder1')).toBe(600000000);
    expect(getFunderContribution(projectId, 'funder2')).toBe(400000000);
    const project = getProject(projectId);
    expect(project.currentFunding).toBe(1000000000);
  });
  
  it('should throw error for non-existent project', () => {
    expect(() => getProject(999)).toThrow('ERR-NOT-FOUND');
    expect(() => fundProject(999, 'funder1', 100000000)).toThrow('ERR-NOT-FOUND');
    expect(() => withdrawFunds(999, 'creator1')).toThrow('ERR-NOT-FOUND');
  });
});



export interface VisionState {
  name: string;
  step: number;
  tenKeywords: string[];
  threeKeywords: string[];
  encouragement: string;
  fiveGoals: string[];
  finalThreeGoals: string[];
  imageUrl: string;
}

export enum AppStep {
  Welcome = 0,
  PickTen = 1,
  PickThree = 2,
  WriteGoals = 3,
  RefineGoals = 4,
  FinalBoard = 5
}

import { Idea } from '../types';

export const saveIdea = async (idea: Partial<Idea>) => {
  return await window.dataSdk.create(idea);
};

export const updateIdea = async (idea: Partial<Idea>) => {
  return await window.dataSdk.update(idea);
};

export const initDataSdk = (onDataChanged: (data: any[]) => void) => {
  window.dataSdk.init(onDataChanged);
};

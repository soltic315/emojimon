type WorldInputLockState = {
  isMoving?: boolean;
  shopActive?: boolean;
  isEncounterTransitioning?: boolean;
  _trainerBattlePending?: boolean;
  _dialogActive?: boolean;
  _starterChoiceActive?: boolean;
};

export function isWorldProgressLocked(state: WorldInputLockState) {
  return !!(state._dialogActive || state._starterChoiceActive || state._trainerBattlePending);
}

export function canInteractInWorld(state: WorldInputLockState) {
  return !state.isMoving
    && !state.shopActive
    && !state.isEncounterTransitioning
    && !isWorldProgressLocked(state);
}

export function canOpenWorldMenu(state: WorldInputLockState) {
  return !state.shopActive
    && !state.isMoving
    && !state.isEncounterTransitioning
    && !isWorldProgressLocked(state);
}

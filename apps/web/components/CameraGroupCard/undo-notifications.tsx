import { Button, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';

const UNDO_TIMEOUT_MS = 6000;

/** Shows `message` with an Undo button for a few seconds. */
function notifyWithUndo(id: string, message: string, onUndo: () => void) {
  const notificationId = `${id}-${Date.now()}`;
  const undo = () => {
    onUndo();
    notifications.hide(notificationId);
  };
  notifications.show({
    id: notificationId,
    autoClose: UNDO_TIMEOUT_MS,
    message: (
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Text size="sm">{message}</Text>
        <Button variant="subtle" size="compact-sm" onClick={undo}>
          Undo
        </Button>
      </Group>
    ),
  });
}

/** Deleting a group is immediate; this offers Undo instead of a confirmation dialog. */
export function notifyGroupRemoved(group: { id: string; name: string }, onUndo: () => void) {
  notifyWithUndo(`group-removed-${group.id}`, `Deleted “${group.name}”`, onUndo);
}

/** Clear all is immediate too, with Undo to bring the previous groups back. */
export function notifyGroupsCleared(onUndo: () => void) {
  notifyWithUndo('groups-cleared', 'Cleared the camera groups', onUndo);
}

/** Switching to Simple trims the setup to fit; Undo puts the Advanced setup back. */
export function notifySwitchedToSimple(changes: string[], onUndo: () => void) {
  notifyWithUndo('switched-to-simple', `Switched to Simple: ${changes.join(', ')}`, onUndo);
}

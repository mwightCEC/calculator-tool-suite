import { Button, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';

const UNDO_TIMEOUT_MS = 6000;

/** Deleting a group is immediate; this offers Undo instead of a confirmation dialog. */
export function notifyGroupRemoved(group: { id: string; name: string }, onUndo: () => void) {
  const notificationId = `group-removed-${group.id}-${Date.now()}`;
  const undo = () => {
    onUndo();
    notifications.hide(notificationId);
  };
  notifications.show({
    id: notificationId,
    autoClose: UNDO_TIMEOUT_MS,
    message: (
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Text size="sm">Deleted “{group.name}”</Text>
        <Button variant="subtle" size="compact-sm" onClick={undo}>
          Undo
        </Button>
      </Group>
    ),
  });
}

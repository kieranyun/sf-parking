// components/bottom-sheet.tsx

import { NextSweep, ParkingRestriction } from '@/app/types';
import { BottomSheet, Host, Text, VStack } from '@expo/ui/swift-ui';

interface RestrictionSheetProps {
  restriction: ParkingRestriction | null;
  nextSweep?: NextSweep | null;
  isOpened: boolean;
  onDismiss: () => void;
}

export default function RestrictionSheet({ restriction, nextSweep, isOpened, onDismiss }: RestrictionSheetProps) {
  if (!restriction) return null;

  const { parkingSpot, sweepSchedule } = restriction;
  console.log(restriction, 'hi')

  const activeWeeks = [
    sweepSchedule.week1,
    sweepSchedule.week2,
    sweepSchedule.week3,
    sweepSchedule.week4,
    sweepSchedule.week5,
  ]
    .map((active, i) => (active ? `Week ${i + 1}` : null))
    .filter(Boolean)
    .join(', ');

  const streetName = `${parkingSpot.street} (${parkingSpot.blockside})`
  const schedule = `${sweepSchedule.weekday}  ${sweepSchedule.fromHour}:00 – ${sweepSchedule.toHour}:00`

  return (
    <Host>
      <VStack>
        <BottomSheet
          isOpened={isOpened}
          onIsOpenedChange={(opened) => {
            if (!opened) onDismiss();
          }}
          presentationDetents={[0.25, 'medium']}
          presentationDragIndicator="visible"
        >
          <Text weight="bold" size={18}>{streetName}</Text>
          <Text size={15} color="#555555">{schedule}</Text>
          <Text size={15} color="#555555">{activeWeeks}</Text>
          {nextSweep && (
            <Text size={15} color="#cc2200">
              Next sweep: {new Date(nextSweep.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {nextSweep.fromHour.toString()}:00
            </Text>
          )}
        </BottomSheet>
      </VStack>
    </Host>
  );
}
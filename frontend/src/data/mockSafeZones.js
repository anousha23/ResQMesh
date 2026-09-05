export const MOCK_SAFE_ZONES = [
  {
    id: 'SZ-001',
    name: 'HILLVIEW SCHOOL',
    distance: '600 m',
    status: 'OPEN',
    capacity: '72%',
    directions: [
      { id: '1', icon: 'arrow-up', text: 'Head North' },
      { id: '2', icon: 'arrow-right', text: 'Turn right at Block A' },
      { id: '3', icon: 'arrow-up', text: 'Continue 300 m' },
      { id: '4', icon: 'check-circle', text: 'Hillview School on left' },
    ]
  },
  {
    id: 'SZ-002',
    name: 'COMMUNITY CENTER',
    distance: '1.1 km',
    status: 'OPEN',
    capacity: '45%',
    directions: [
      { id: '1', icon: 'arrow-down', text: 'Head South towards Main Rd' },
      { id: '2', icon: 'arrow-left', text: 'Turn left at Central Park' },
      { id: '3', icon: 'check-circle', text: 'Community Center straight ahead' },
    ]
  },
  {
    id: 'SZ-003',
    name: 'GOVERNMENT SCHOOL',
    distance: '1.8 km',
    status: 'OPEN',
    capacity: '88%',
    directions: [
      { id: '1', icon: 'arrow-up', text: 'Follow Sector 4 Road' },
      { id: '2', icon: 'check-circle', text: 'School is at the end of the road' },
    ]
  },
  {
    id: 'SZ-004',
    name: 'SPORTS COMPLEX',
    distance: '2.4 km',
    status: 'LIMITED CAPACITY',
    capacity: '98%',
    directions: [
      { id: '1', icon: 'arrow-right', text: 'Head East on Ring Road' },
      { id: '2', icon: 'check-circle', text: 'Complex on the right' },
    ]
  }
];

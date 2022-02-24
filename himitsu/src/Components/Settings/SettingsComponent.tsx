import React, { ReactElement, useEffect } from 'react';

const SettingsComponent: React.FC = (): ReactElement => {
  // const [type, setType] = useState('');

  let loaded = false;
  const loadSettings = async (): Promise<void> => {
    console.log('test');
    loaded = true;
  };

  useEffect(() => {
    if (!loaded) { loadSettings(); }
  });

  return (
    <div>
      Settings go here
    </div>
  );
};

export default SettingsComponent;

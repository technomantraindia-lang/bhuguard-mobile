import { useEffect, useState } from 'react';

import { StyleSheet, Text, View } from 'react-native';



import { LoadingState } from '../LoadingState';

import { colors } from '../../theme/colors';

import { cacheActivityEvidenceFileUri } from '../../utils/evidenceFileDownload';

import { EvidenceStampedImageFrame } from './EvidenceStampedImageFrame';



interface ActivityEvidenceImagePreviewProps {

  activityId: number | string;

  title?: string;

  onOpenFullscreen?: (uri: string, title?: string) => void;

}



export function ActivityEvidenceImagePreview({

  activityId,

  title,

  onOpenFullscreen,

}: ActivityEvidenceImagePreviewProps) {

  const [uri, setUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [failed, setFailed] = useState(false);



  useEffect(() => {

    let active = true;



    void cacheActivityEvidenceFileUri(activityId).then((cachedUri) => {

      if (!active) {

        return;

      }



      setUri(cachedUri);

      setFailed(!cachedUri);

      setLoading(false);

    });



    return () => {

      active = false;

    };

  }, [activityId]);



  if (loading) {

    return (

      <View style={styles.loadingWrap}>

        <LoadingState message="Loading activity photo..." />

      </View>

    );

  }



  if (failed || !uri) {

    return (

      <View style={styles.placeholder}>

        <Text style={styles.placeholderText}>Unable to load the activity evidence photo.</Text>

      </View>

    );

  }



  return (

    <EvidenceStampedImageFrame

      uri={uri}

      onPress={onOpenFullscreen ? () => onOpenFullscreen(uri, title ?? 'Activity Evidence') : undefined}

    />

  );

}



const styles = StyleSheet.create({

  loadingWrap: {

    minHeight: 180,

    justifyContent: 'center',

  },

  placeholder: {

    minHeight: 120,

    borderRadius: 14,

    borderWidth: 1,

    borderColor: colors.border,

    backgroundColor: colors.card,

    padding: 16,

    justifyContent: 'center',

  },

  placeholderText: {

    fontSize: 13,

    color: colors.textMuted,

    textAlign: 'center',

    lineHeight: 20,

  },

});



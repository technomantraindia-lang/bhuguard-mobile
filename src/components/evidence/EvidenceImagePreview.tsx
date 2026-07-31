import { useEffect, useState } from 'react';

import { StyleSheet, Text, View } from 'react-native';



import { LoadingState } from '../LoadingState';

import { colors } from '../../theme/colors';

import {

  cacheEvidenceFileUri,

  isEvidenceImageMime,

  type EvidenceDownloadRole,

} from '../../utils/evidenceFileDownload';

import { EvidenceStampedImageFrame } from './EvidenceStampedImageFrame';



interface EvidenceImagePreviewProps {

  role: EvidenceDownloadRole;

  evidenceId: number | string;

  mimeType?: string | null;

  title?: string;

  onOpenFullscreen?: (uri: string, title?: string) => void;

}



export function EvidenceImagePreview({

  role,

  evidenceId,

  mimeType,

  title,

  onOpenFullscreen,

}: EvidenceImagePreviewProps) {

  const [uri, setUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [failed, setFailed] = useState(false);



  useEffect(() => {

    let active = true;



    void cacheEvidenceFileUri(role, evidenceId, mimeType ?? undefined).then((cachedUri) => {

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

  }, [evidenceId, mimeType, role]);



  if (!isEvidenceImageMime(mimeType ?? undefined)) {

    return (

      <View style={styles.placeholder}>

        <Text style={styles.placeholderText}>This evidence file is not an image. View metadata for details.</Text>

      </View>

    );

  }



  if (loading) {

    return (

      <View style={styles.loadingWrap}>

        <LoadingState message="Loading evidence photo..." />

      </View>

    );

  }



  if (failed || !uri) {

    return (

      <View style={styles.placeholder}>

        <Text style={styles.placeholderText}>Unable to load the evidence photo.</Text>

      </View>

    );

  }



  return (

    <EvidenceStampedImageFrame

      uri={uri}

      onPress={onOpenFullscreen ? () => onOpenFullscreen(uri, title ?? 'Evidence Photo') : undefined}

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



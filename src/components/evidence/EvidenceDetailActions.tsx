import { useState } from 'react';

import { Alert, StyleSheet, View } from 'react-native';



import { AppButton } from '../AppButton';

import type { ApiRecord } from '../../utils/apiHelpers';

import {

  downloadEvidenceFile,

  evidenceFileNameFromRecord,

  type EvidenceDownloadRole,

} from '../../utils/evidenceFileDownload';

import { exportEvidenceHtmlPdf } from '../../utils/evidenceHtmlPdf';



interface EvidenceDetailActionsProps {

  role: EvidenceDownloadRole;

  evidence: ApiRecord;

}



export function EvidenceDetailActions({ role, evidence }: EvidenceDetailActionsProps) {
  if (role === 'farmer') {
    return null;
  }

  const evidenceId = evidence.id as number | string;

  const [downloadingFile, setDownloadingFile] = useState(false);

  const [exportingPdf, setExportingPdf] = useState(false);



  const handleDownloadFile = async () => {

    setDownloadingFile(true);



    try {

      const result = await downloadEvidenceFile(

        role,

        evidenceId,

        evidenceFileNameFromRecord(evidence).replace(/\.[^.]+$/, ''),

        typeof evidence.mime_type === 'string' ? evidence.mime_type : undefined,

      );



      if (!result.success) {

        Alert.alert('Download failed', result.message ?? 'Unable to download evidence file.');

      }

    } finally {

      setDownloadingFile(false);

    }

  };



  const handleExportPdf = async () => {

    setExportingPdf(true);



    try {

      const result = await exportEvidenceHtmlPdf(role, evidence);



      if (!result.success) {

        Alert.alert('PDF export failed', result.message ?? 'Unable to generate evidence PDF.');

      }

    } finally {

      setExportingPdf(false);

    }

  };



  return (

    <View style={styles.wrap}>

      <AppButton

        label="Download Evidence PDF"

        onPress={() => void handleExportPdf()}

        loading={exportingPdf}

        disabled={downloadingFile}

      />

      <AppButton

        label="Download Original File"

        variant="secondary"

        onPress={() => void handleDownloadFile()}

        loading={downloadingFile}

        disabled={exportingPdf}

      />

    </View>

  );

}



const styles = StyleSheet.create({

  wrap: { gap: 10, marginTop: 8 },

});



import {MeetingSummaryReferrer} from './MeetingSummaryEmail'
import React from 'react'
import {PALETTE} from '../../../../../styles/paletteV2'
import {FONT_FAMILY} from '../../../../../styles/typographyV2'
import {buttonShadow} from '../../../../../styles/elevation'
import AnchorIfEmail from './AnchorIfEmail'

interface Props {
  referrer: MeetingSummaryReferrer
  isDemo: boolean
  teamDashUrl: string
}

const teamDashLabel = 'Go to Team Dashboard'

const primaryButtonStyle = {
  backgroundColor: PALETTE.BACKGROUND_ORANGE,
  backgroundImage: PALETTE.GRADIENT_WARM,
  borderRadius: 32,
  boxShadow: buttonShadow,
  color: '#FFFFFF',
  cursor: 'pointer',
  fontFamily: FONT_FAMILY.SANS_SERIF,
  fontSize: 14,
  fontWeight: 600,
  padding: '9px 20px',
  textDecoration: 'none'
}

const buttonCellStyle = {
  paddingTop: 44
}

const SummarySheetCTA = (props: Props) => {
  const {isDemo, referrer, teamDashUrl} = props
  if (isDemo) return null
  return (
    <tr>
      <td align={'center'} style={buttonCellStyle}>
        <AnchorIfEmail
          isEmail={referrer === 'email'}
          href={teamDashUrl}
          style={primaryButtonStyle}
          title={teamDashLabel}
        >
          {teamDashLabel}
        </AnchorIfEmail>
      </td>
    </tr>
  )
}

export default SummarySheetCTA

import { Box, BoxProps } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import React from 'react';

type PulsingDotProps = BoxProps & {
    animated?: boolean;
};

export const PulsingDot: React.FC<PulsingDotProps> = ({ animated, ...props }) => {
    const ringScaleMin = 0.33;
    const ringScaleMax = 0.66;

    const pulseRing = keyframes`
    0% {
        transform: scale(${ringScaleMin});
    }
    30% {
        transform: scale(${ringScaleMax});
    }
    40%, 50% {
        opacity: 0;
    }
    100% {
        opacity: 0;
    }
    `;

    const pulseDot = keyframes`
    0% {
        transform: scale(0.9);
    }
    25% {
        transform: scale(1.1);
    }
    50% {
        transform: scale(0.9);
    }
    100% {
        transform: scale(0.9);
    }
    `;

    return (
        <Box
            {...props}
            as='div'
            aspectRatio={1}
            position='relative'
            borderRadius='50%'
            _before={
                animated
                    ? {
                          content: "''",
                          display: 'block',
                          position: 'absolute',
                          width: '300%',
                          height: '300%',
                          boxSizing: 'border-box',
                          marginLeft: '-100%',
                          marginTop: '-100%',
                          borderRadius: '50%',
                          bgColor: props.bgColor,
                          animation: `2.25s ${pulseRing} cubic-bezier(0.455, 0.03, 0.515, 0.955) -0.4s infinite`,
                      }
                    : {}
            }
            _after={
                animated
                    ? {
                          animation: `2.25s ${pulseDot} cubic-bezier(0.455, 0.03, 0.515, 0.955) -0.4s infinite`,
                      }
                    : {}
            }
        />
    );
};

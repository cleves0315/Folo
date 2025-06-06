import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface ListExpansionCuteReIconProps {
  width?: number
  height?: number
  color?: string
}

export const ListExpansionCuteReIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: ListExpansionCuteReIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M3.673 4.063C3.31 4.175 3 4.606 3 5c0 .405.309.826.69.939.308.092 8.312.092 8.62 0 .378-.112.69-.537.69-.939 0-.402-.312-.827-.69-.939-.299-.089-8.348-.087-8.637.002m13.015.778c-.59.061-.925.223-1.108.535-.281.48-.155.923.671 2.364.65 1.132.992 1.592 1.315 1.766.094.05.223.072.437.073.268.001.325-.013.499-.12.108-.067.29-.238.405-.38.334-.414 1.252-1.986 1.5-2.57.358-.84.058-1.459-.789-1.63-.292-.059-2.46-.087-2.93-.038M3.673 11.063C3.31 11.175 3 11.606 3 12c0 .405.309.826.69.939.308.092 8.312.092 8.62 0 .378-.112.69-.537.69-.939 0-.402-.312-.827-.69-.939-.299-.089-8.348-.087-8.637.002M16.71 14.84c-.604.058-.944.219-1.13.536-.281.479-.149.941.683 2.389.881 1.534 1.215 1.871 1.813 1.828.473-.035.777-.333 1.398-1.373.799-1.339 1.045-1.853 1.077-2.25.046-.573-.285-.961-.933-1.091-.29-.058-2.41-.087-2.908-.039M3.673 18.063C3.31 18.175 3 18.606 3 19c0 .405.309.826.69.939.308.092 8.312.092 8.62 0 .378-.112.69-.537.69-.939 0-.402-.312-.827-.69-.939-.299-.089-8.348-.087-8.637.002"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}

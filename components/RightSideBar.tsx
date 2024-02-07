import React, { useRef } from 'react'
import Dimensions from './settings/Dimensions'
import Color from './settings/Color'
import Export from './settings/Export'
import Text from './settings/Text'
import { RightSidebarProps } from '@/types/type'
import { modifyShape } from '@/lib/shapes'

const RightSideBar = ({
  elementAttributes,
  setElementAttributes,
  fabricRef,
  isEditingRef,
  activeObjectRef,
  syncShapeInStorage
}: RightSidebarProps) => {
  const handleInputChange = (property: string, value: string) => {
    if(!isEditingRef.current) isEditingRef.current =  true

    setElementAttributes((prev) => ({
      ...prev, [property]:value
    }))

    modifyShape({
       canvas: fabricRef.current as fabric.Canvas,
       property,
       value,
       activeObjectRef,
       syncShapeInStorage
    })
  }

  const colorInputRef = useRef(null);
  const strokeInputRef = useRef(null);

  return (
    <section className='flex flex-col border-t
     border-primary-grey-200 bg-primary-black text-primary-grey-300
     min-w-[227px] sticky right-0 h-full max-sm:hidden select-none'>
      <h3 className="px-5 pt-4 text-xs uppercase text-center">Design</h3>
      <span className='text-xs text-center text-primary-grey-300 mt-3 pb-1 px-5 border-b border-primary-grey-200'>Canvas Editor</span>

      <Dimensions 
        width={elementAttributes.width}
        height={elementAttributes.height}
        isEditingRef={isEditingRef}
        handleInputChange={handleInputChange}
      />
      <Text 
        fontFamily={elementAttributes.fontFamily}
        fontSize={elementAttributes.fontSize}
        fontWeight={elementAttributes.fontWeight}
        handleInputChange={handleInputChange}
      />
      <Color 
        inputRef={colorInputRef}
        attribute={elementAttributes.fill}
        placeholder="color"
        attributeType='fill'
        handleInputChange={handleInputChange}
      />
      <Color 
        inputRef={strokeInputRef}
        attribute={elementAttributes.stroke}
        placeholder="stroke"
        attributeType='stroke'
        handleInputChange={handleInputChange}
      />
      <Export />
     </section>
  )
}

export default RightSideBar
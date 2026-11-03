import {renderHook,act,fireEvent} from '@testing-library/react';
import {it,expect,vi} from 'vitest';
import {useResizable} from '../hooks/useResizable';
import {mediaQuery} from '../theme/designTokens';
it.each(['left','right'])('resizes %s edge within bounds, ends drag and resets',side=>{
 const {result,unmount}=renderHook(()=>useResizable({initialSize:200,min:100,max:300,side}));
 const preventDefault=vi.fn(); act(()=>result.current.handleMouseDown({clientX:100,preventDefault}));
 expect(preventDefault).toHaveBeenCalled();expect(result.current.isResizing).toBe(true);
 act(()=>fireEvent.mouseMove(window,{clientX:side==='right'?250:-50}));expect(result.current.size).toBe(300);
 act(()=>fireEvent.mouseMove(window,{clientX:side==='right'?-250:450}));expect(result.current.size).toBe(100);
 act(()=>fireEvent.mouseUp(window));expect(result.current.isResizing).toBe(false);
 act(()=>fireEvent.mouseMove(window,{clientX:900}));expect(result.current.size).toBe(100);
 act(()=>result.current.resetSize());expect(result.current.size).toBe(200);unmount();
});
it('defaults to right edge and maps named or numeric breakpoints',()=>{
 const {result}=renderHook(()=>useResizable({initialSize:100,min:50,max:200}));expect(result.current.size).toBe(100);
 expect(mediaQuery('md')).toBe('@media (min-width: 768px)');expect(mediaQuery(400)).toBe('@media (min-width: 400px)');
 const warn=vi.spyOn(console,'warn').mockImplementation(()=>{});expect(mediaQuery('unknown')).toBe('@media (min-width: 0px)');expect(warn).toHaveBeenCalled();warn.mockRestore();
});

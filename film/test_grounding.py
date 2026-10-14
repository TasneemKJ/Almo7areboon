"""Renderer regressions; run with python -m unittest discover -s film -p 'test_*.py'."""
import unittest
from unittest.mock import patch
from PIL import Image
import produce as p


class GroundingTests(unittest.TestCase):
 def test_camera_projects_source_ground_into_both_formats(self):
  for width,height in [(1080,1920),(1920,1080)]:
   for t in [10.5,15,19.5,20.5,25,29.5,30.5,35,39.5,50.5,55,59.5]:
    im,project,scale=p.ground_scene(t,width,height)
    calls=[]
    with patch.object(p,'actor',side_effect=lambda *args,**kwargs:calls.append(args)):
     p.ground_company(im,t,project,scale)
    ground_top=project(0,850)[1];ground_bottom=project(0,990)[1]
    for _,name,x,base,h,frame in calls:
     self.assertGreaterEqual(base,ground_top)
     self.assertLessEqual(base,ground_bottom)
     self.assertLess(base,height*.85)
     self.assertGreater(x,0)
     self.assertLess(x,width)
     self.assertGreater(h/scale,150)
     self.assertLessEqual(h/scale,330.000001)

 def test_establishing_and_valley_shots_have_no_unsupported_actors(self):
  for t in [1,5,9,41,45,49]:
   im,project,scale=p.ground_scene(t,1920,1080)
   with patch.object(p,'actor') as actor:
    p.ground_company(im,t,project,scale)
   actor.assert_not_called()

 def test_stance_foot_cancels_root_travel(self):
  for height in [185,220,255,330]:
   stride=height*.38
   for phase in [.05,.15,.25,.35]:
    distance=stride*phase
    dx,lift=p.gait(distance,height,0)
    next_dx,next_lift=p.gait(distance+stride*.01,height,0)
    self.assertAlmostEqual(distance+dx,distance+stride*.01+next_dx)
    self.assertEqual(lift,0)
    self.assertEqual(next_lift,0)

 def test_arrival_holds_both_feet_at_road_contact(self):
  for height,cycles in [(220,2),(220,2.5),(255,2.5)]:
   for leg in [0,1]:
    _,lift=p.gait(height*.38*cycles,height,leg)
    self.assertAlmostEqual(lift,0,places=8)
  _,lift=p.gait(220*.38*.75,220,0)
  self.assertGreater(lift,5)

 def test_contact_shadow_preserves_ground_color_and_visible_sole(self):
  im=Image.new('RGBA',(400,400),(210,170,110,255))
  p.actor(im,'pathkeeper',200,300,200,4)
  # A sample just below the sole lies within the soft contact, not in an opaque oval.
  r,g,b,a=im.getpixel((200,302))
  self.assertGreater(r,120)
  self.assertGreater(g,90)
  self.assertEqual(a,255)
  self.assertEqual(im.getpixel((20,302)),(210,170,110,255))


if __name__=='__main__':unittest.main()

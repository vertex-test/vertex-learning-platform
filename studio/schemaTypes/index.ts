import {type SchemaTypeDefinition} from 'sanity'

import {category} from './documents/category'
import {course} from './documents/course'
import {instructor} from './documents/instructor'
import {lesson} from './documents/lesson'
import {video} from './documents/video'
import {blockContent} from './objects/block-content'
import {courseModule} from './objects/course-module'
import {learningOutcome} from './objects/learning-outcome'
import {lessonResource} from './objects/lesson-resource'
import {videoChapter} from './objects/video-chapter'
import {videoChunk} from './objects/video-chunk'

export const schemaTypes: SchemaTypeDefinition[] = [
  // Documents
  course,
  lesson,
  instructor,
  category,
  video,
  // Objects
  courseModule,
  learningOutcome,
  lessonResource,
  videoChapter,
  videoChunk,
  blockContent,
]

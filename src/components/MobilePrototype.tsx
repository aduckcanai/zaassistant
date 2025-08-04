import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Star,
  Clock,
  User,
} from 'lucide-react';

interface MobilePrototypeProps {
  type: 'task-list' | 'dashboard' | 'form' | 'feed';
  variant: string;
}

export function MobilePrototype({ variant }: MobilePrototypeProps) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const toggleTask = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const mockTasks = [
    {
      id: '1',
      title: 'Review product requirements',
      priority: 'high',
      completed: false,
    },
    {
      id: '2',
      title: 'Update user stories',
      priority: 'medium',
      completed: true,
    },
    {
      id: '3',
      title: 'Schedule team meeting',
      priority: 'low',
      completed: false,
    },
    {
      id: '4',
      title: 'Analyze user feedback',
      priority: 'high',
      completed: false,
    },
    {
      id: '5',
      title: 'Create wireframes',
      priority: 'medium',
      completed: false,
    },
  ];

  const renderTaskList = () => {
    if (variant === 'cards') {
      return (
        <div className='space-y-3'>
          {mockTasks.map(task => (
            <Card key={task.id} className='border border-border/50'>
              <CardContent className='p-4'>
                <div className='flex items-start gap-3'>
                  <Checkbox
                    checked={selectedTasks.includes(task.id)}
                    onCheckedChange={() => toggleTask(task.id)}
                    className='mt-1'
                  />
                  <div className='flex-1 min-w-0'>
                    <p
                      className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {task.title}
                    </p>
                    <div className='flex items-center gap-2 mt-2'>
                      <Badge
                        variant={
                          task.priority === 'high'
                            ? 'destructive'
                            : task.priority === 'medium'
                              ? 'default'
                              : 'secondary'
                        }
                        className='text-xs'
                      >
                        {task.priority}
                      </Badge>
                      <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                        <Clock className='w-3 h-3' />
                        2h ago
                      </div>
                    </div>
                  </div>
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                    <MoreVertical className='w-4 h-4' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    } else {
      return (
        <div className='space-y-1'>
          {mockTasks.map(task => (
            <div
              key={task.id}
              className='flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg'
            >
              <Checkbox
                checked={selectedTasks.includes(task.id)}
                onCheckedChange={() => toggleTask(task.id)}
              />
              <div className='flex-1 min-w-0'>
                <p
                  className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                >
                  {task.title}
                </p>
                <div className='flex items-center gap-2 mt-1'>
                  <Badge
                    variant={
                      task.priority === 'high'
                        ? 'destructive'
                        : task.priority === 'medium'
                          ? 'default'
                          : 'secondary'
                    }
                    className='text-xs'
                  >
                    {task.priority}
                  </Badge>
                  <span className='text-xs text-muted-foreground'>2h ago</span>
                </div>
              </div>
              <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                <MoreVertical className='w-4 h-4' />
              </Button>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className='w-full max-w-80 mx-auto'>
      <div className='aspect-[320/600] border border-border rounded-2xl bg-background shadow-lg overflow-hidden relative'>
        {/* Mobile Header */}
        <div className='flex items-center justify-between p-4 border-b border-border bg-card'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-primary rounded-full flex items-center justify-center'>
              <User className='w-4 h-4 text-primary-foreground' />
            </div>
            <div>
              <h3 className='font-medium text-sm'>My Tasks</h3>
              <p className='text-xs text-muted-foreground'>5 items</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
              <Search className='w-4 h-4' />
            </Button>
            <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
              <Filter className='w-4 h-4' />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='p-4 border-b border-border bg-muted/20'>
          <div className='flex items-center gap-2'>
            <Button size='sm' className='flex items-center gap-2 text-xs'>
              <Plus className='w-4 h-4' />
              Add Task
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='flex items-center gap-2 text-xs'
            >
              <Star className='w-4 h-4' />
              Priority
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className='absolute inset-x-0 top-[140px] bottom-0 p-4 overflow-y-auto'>
          {renderTaskList()}
        </div>
      </div>
    </div>
  );
}
